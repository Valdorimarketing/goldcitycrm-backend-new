// operations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OperationType } from '../entities/operation-type.entity';
import { OperationFollowup } from '../entities/operation-followup.entity';
import { CreateOperationTypeDto } from '../dto/create-operation-type.dto';
import { CreateScheduleDto } from '../dto/create-schedule.dto';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(OperationType)
    private readonly operationTypeRepo: Repository<OperationType>,

    @InjectRepository(OperationFollowup)
    private readonly followupRepo: Repository<OperationFollowup>,
  ) { }

  async listOperationTypes(): Promise<OperationType[]> {
    return this.operationTypeRepo.find({ order: { name: 'ASC' } });
  }

  // Tek root kayıt oluşturur ve followups JSON alanını doldurur
  async createFollowupPlan(dto: CreateScheduleDto, userId?: number) {
    const opType = await this.operationTypeRepo.findOneBy({ id: dto.operation_type_id });
    if (!opType) throw new NotFoundException('Operation type not found');

    // dto.scheduled_at zaten +03:00 içeriyor
    const baseDateStr = dto.scheduled_at;

    const baseDate = new Date(baseDateStr);

    // +03:00'a göre string üretici
    const toTurkeyISOString = (date: Date) => {
      // date zaten TR saatiyle gelmiş oluyor, UTC’ye çevirmeden parse edelim
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00+03:00`;
    };

    const addDays = (d: Date, days: number) => {
      const n = new Date(d);
      n.setDate(n.getDate() + days);
      return n;
    };

    const addMonths = (d: Date, months: number) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + months);
      return n;
    };

    const dayOffsets = dto.followups?.days?.map(d => d.offset) ?? [1, 5, 7, 10];
    const monthOffsets = dto.followups?.months?.map(m => m.offset) ?? [1, 2, 4, 6, 8, 10, 12];

    const days = dayOffsets.map(off => ({
      offset: off,
      date: toTurkeyISOString(addDays(baseDate, off)), // ✅ artık +03:00 formatında
      done: false,
      kind: 'day',
    }));

    const months = monthOffsets.map(off => ({
      offset: off,
      date: toTurkeyISOString(addMonths(baseDate, off)),
      done: false,
      kind: 'month',
    }));

    const root = this.followupRepo.create({
      customer_id: dto.customer_id,
      operation_type_id: dto.operation_type_id,
      scheduled_at: toTurkeyISOString(baseDate),
      followups: { days, months },
      created_by: userId ?? null,
      done: false,
    } as any); // 👈 geçici ama çalışır


    return await this.followupRepo.save(root);
  }


  async createOperationType(dto: CreateOperationTypeDto, userId: number) {
    const entity = this.operationTypeRepo.create({
      name: dto.name,
      description: dto.description || null,
      created_by: userId,
    });
    return this.operationTypeRepo.save(entity);
  }

  // Müşterinin operasyon (root) kayıtlarını getir. followups JSON dahil.
  async listCustomerFollowups(customerId: number) {
    return this.followupRepo.find({
      where: { customer_id: customerId },
      relations: ['operationType'],
      order: { scheduled_at: 'ASC' },
    });
  }

  async deleteFollowup(id: number): Promise<boolean> {
    const existing = await this.followupRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Takip kaydı bulunamadı.');
    await this.followupRepo.remove(existing);
    return true;
  }

  // Root içindeki followups JSON'daki ilgili öğeyi güncelle
  // payload: { kind: 'day'|'month', offset: number, done: boolean }
  async updateFollowupInSchedule(id: number, payload: { kind: 'day' | 'month', offset: number, done: boolean }) {
    const schedule = await this.followupRepo.findOneBy({ id });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const fu = schedule.followups || { days: [], months: [] };

    if (payload.kind === 'day') {
      fu.days = (fu.days || []).map(d => (d.offset === payload.offset ? { ...d, done: payload.done } : d));
    } else {
      fu.months = (fu.months || []).map(m => (m.offset === payload.offset ? { ...m, done: payload.done } : m));
    }

    schedule.followups = fu;
    await this.followupRepo.save(schedule);
    return schedule;
  }




 async checkDueFollowups() {
  const schedules = await this.followupRepo.find({
    relations: ['customer', 'operationType'],
  });

  // Europe/Istanbul takvim gününü YYYY-MM-DD olarak döndürür
  const ymdTR = (input: Date | string) => {
    const d = new Date(input);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const y = fmt.find(p => p.type === 'year')!.value;
    const m = fmt.find(p => p.type === 'month')!.value;
    const day = fmt.find(p => p.type === 'day')!.value;
    return `${y}-${m}-${day}`; // YYYY-MM-DD
  };

  const todayStr = ymdTR(new Date());

  const notifications: any[] = [];

  for (const schedule of schedules) {
    const { followups } = schedule;
    if (!followups?.days?.length) continue;

    for (const f of followups.days) {
      // f.date: "2025-11-07T00:00:00+03:00" gibi → TR gününü al
      const fDateStr = ymdTR(f.date);

      const expired = fDateStr < todayStr;
      const isToday = fDateStr === todayStr;

      if (isToday || expired) {
        const customerName =
          schedule.customer?.name ?? `Müşteri #${schedule.customer_id}`;

        const opTypeName =
          schedule.operationType?.name ?? `Operasyon #${schedule.operation_type_id}`;

        const message = isToday
          ? `${customerName} için "${opTypeName}" operasyonunun ${f.offset}. gün takibi bugün.`
          : `${customerName} için "${opTypeName}" operasyonunun ${f.offset}. gün takibi gecikti.`;

        notifications.push({
          id: `${schedule.id}-${f.offset}-${f.kind ?? 'day'}`,
          schedule_id: schedule.id,
          customer_id: schedule.customer_id,
          customer_name: customerName,
          operation_type_id: schedule.operation_type_id,
          operation_type_name: opTypeName,
          date: f.date,             // orijinal stringi koru
          offset: f.offset,
          kind: f.kind ?? 'day',
          expired,
          done: f.done ?? false,
          message,
          createdAt: f.date, 
        });
      }
    }
  }

  return { success: true, data: notifications };
}






}

// operations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OperationType } from '../entities/operation-type.entity';
import { OperationFollowup } from '../entities/operation-followup.entity';
import { CustomerNote } from '../../customer-note/entities/customer-note.entity'; // EKLENDİ
import { CreateOperationTypeDto } from '../dto/create-operation-type.dto';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { CustomerHistory } from 'src/modules/customer-history/entities/customer-history.entity';

interface FollowupItemData {
  offset: number;
  date: string;
  done: boolean;
  note: string;
  kind: 'day' | 'month';
}

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(OperationType)
    private readonly operationTypeRepo: Repository<OperationType>,

    @InjectRepository(OperationFollowup)
    private readonly followupRepo: Repository<OperationFollowup>,

    @InjectRepository(CustomerHistory)
    private readonly customerHistoryRepo: Repository<CustomerHistory>,

    @InjectRepository(CustomerNote) // EKLENDİ
    private readonly customerNoteRepo: Repository<CustomerNote>,
  ) { }

  async listOperationTypes(): Promise<OperationType[]> {
    return this.operationTypeRepo.find({ order: { name: 'ASC' } });
  }

  async createFollowupPlan(dto: CreateScheduleDto, userId?: number) {
    const opType = await this.operationTypeRepo.findOneBy({ id: dto.operation_type_id });
    if (!opType) throw new NotFoundException('Operation type not found');

    const baseDateStr = dto.scheduled_at;
    const baseDate = new Date(baseDateStr);

    const toTurkeyISOString = (date: Date) => {
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

    const days: FollowupItemData[] = dayOffsets.map(off => ({
      offset: off,
      date: toTurkeyISOString(addDays(baseDate, off)),
      done: false,
      note: '',
      kind: 'day' as const,
    }));

    const months: FollowupItemData[] = monthOffsets.map(off => ({
      offset: off,
      date: toTurkeyISOString(addMonths(baseDate, off)),
      done: false,
      note: '',
      kind: 'month' as const,
    }));

    const root = this.followupRepo.create({
      customer_id: dto.customer_id,
      operation_type_id: dto.operation_type_id,
      scheduled_at: toTurkeyISOString(baseDate),
      followups: { days, months },
      created_by: userId ?? null,
      done: false,
    } as any);

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

  async listCustomerFollowups(customerId: number) {
    return this.followupRepo.find({
      where: { customer_id: customerId },
      relations: [
        'operationType',
        'customer',
        'customer.relevantUserData',
        'customer.statusData',
        'customer.subSegment',
        'customer.subSegment.parentStatus'
      ],
      order: { scheduled_at: 'ASC' },
    });
  }

  async deleteFollowup(id: number): Promise<boolean> {
    const existing = await this.followupRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Takip kaydı bulunamadı.');
    await this.followupRepo.remove(existing);
    return true;
  }

  // GÜNCELLENDİ - Customer History + Customer Note ekleme
  async updateFollowupInSchedule(
    id: number,
    payload: { kind: 'day' | 'month'; offset: number; done?: boolean; note?: string },
    userId?: number
  ) {
    const schedule = await this.followupRepo.findOne({
      where: { id },
      relations: ['operationType', 'customer']
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const fu = schedule.followups || { days: [], months: [] };

    // Önceki durumu kaydet
    let previousDone = false;
    let previousNote = '';
    let updatedItem: FollowupItemData | null = null;

    if (payload.kind === 'day') {
      fu.days = (fu.days || []).map(d => {
        if (d.offset === payload.offset) {
          previousDone = d.done;
          previousNote = d.note || '';
          const updated = {
            ...d,
            done: payload.done !== undefined ? payload.done : d.done,
            note: payload.note !== undefined ? payload.note : (d.note || ''),
          };
          updatedItem = updated;
          return updated;
        }
        return d;
      });
    } else {
      fu.months = (fu.months || []).map(m => {
        if (m.offset === payload.offset) {
          previousDone = m.done;
          previousNote = m.note || '';
          const updated = {
            ...m,
            done: payload.done !== undefined ? payload.done : m.done,
            note: payload.note !== undefined ? payload.note : (m.note || ''),
          };
          updatedItem = updated;
          return updated;
        }
        return m;
      });
    }

    schedule.followups = fu;
    await this.followupRepo.save(schedule);

    const operationName = schedule.operationType?.name || 'Operasyon';
    const offsetText = payload.kind === 'day'
      ? `${payload.offset}. gün`
      : `${payload.offset}. ay`;

    // 1. Durum değişikliği: done false -> true
    if (!previousDone && payload.done === true && updatedItem) {
      const description = updatedItem.note
        ? `${operationName} - ${offsetText} takibi tamamlandı. Not: ${updatedItem.note}`
        : `${operationName} - ${offsetText} takibi tamamlandı.`;

      // Customer History'e kaydet
      const historyEntry = this.customerHistoryRepo.create({
        customer: schedule.customer_id,
        user: userId || null,
        action: 'Operasyon Takip Güncellendi',
        description: description,
        relatedId: schedule.id,
        requestData: JSON.stringify({
          scheduleId: schedule.id,
          operationType: operationName,
          kind: payload.kind,
          offset: payload.offset,
          note: updatedItem.note,
          date: updatedItem.date
        }),
      });
      await this.customerHistoryRepo.save(historyEntry);

      // Customer Note'a da kaydet (eğer not varsa)
      if (updatedItem.note) {
        const noteEntry = this.customerNoteRepo.create({
          customer: schedule.customer_id,
          user: userId || null,
          note: `[${operationName} - ${offsetText}] ${updatedItem.note}`,
          isReminding: false,
          noteType: 'operation_followup',
        });
        await this.customerNoteRepo.save(noteEntry);
      }
    }

    // 2. Sadece not güncelleme (done değişmedi ama not değişti)
    if (payload.note !== undefined && payload.note !== previousNote && payload.done === undefined) {
      // Yeni not varsa ve öncekinden farklıysa
      if (payload.note.trim()) {
        // Customer History'e kaydet
        const historyEntry = this.customerHistoryRepo.create({
          customer: schedule.customer_id,
          user: userId || null,
          action: 'Operasyon Takip Notu Eklendi',
          description: `${operationName} - ${offsetText} için not eklendi: ${payload.note}`,
          relatedId: schedule.id,
          requestData: JSON.stringify({
            scheduleId: schedule.id,
            operationType: operationName,
            kind: payload.kind,
            offset: payload.offset,
            note: payload.note,
            date: updatedItem?.date
          }),
        });
        await this.customerHistoryRepo.save(historyEntry);

        // Customer Note'a da kaydet
        const noteEntry = this.customerNoteRepo.create({
          customer: schedule.customer_id,
          user: userId || null,
          note: `[${operationName} - ${offsetText}] ${payload.note}`,
          isReminding: false,
          noteType: 'operation_followup',
        });
        await this.customerNoteRepo.save(noteEntry);
      }
    }

    return schedule;
  }

  async checkDueFollowups() {
    const schedules = await this.followupRepo.find({
      relations: ['customer', 'operationType', 'customer.relevantUserData'],
    });

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
      return `${y}-${m}-${day}`;
    };

    const todayStr = ymdTR(new Date());
    const notifications: any[] = [];

    for (const schedule of schedules) {
      const { followups } = schedule;
      if (!followups?.days?.length) continue;

      for (const f of followups.days) {
        const fDateStr = ymdTR(f.date);
        const expired = fDateStr < todayStr;
        const isToday = fDateStr === todayStr;

        if (isToday || expired) {
          const customerName = schedule.customer?.name ?? `Müşteri #${schedule.customer_id}`;
          const opTypeName = schedule.operationType?.name ?? `Operasyon #${schedule.operation_type_id}`;
          const consultantName = schedule.customer?.relevantUserData
            ? `${schedule.customer.relevantUserData.name || ''}`.trim()
            : '-';

          const message = isToday
            ? `${customerName} için "${opTypeName}" operasyonunun ${f.offset}. gün takibi bugün.`
            : `${customerName} için "${opTypeName}" operasyonunun ${f.offset}. gün takibi gecikti.`;

          notifications.push({
            id: `${schedule.id}-${f.offset}-${f.kind ?? 'day'}`,
            schedule_id: schedule.id,
            customer_id: schedule.customer_id,
            customer_name: customerName,
            consultant_name: consultantName,
            customer_status: schedule.customer?.statusData?.name || '-',
            operation_type_id: schedule.operation_type_id,
            operation_type_name: opTypeName,
            date: f.date,
            offset: f.offset,
            kind: f.kind ?? 'day',
            expired,
            done: f.done ?? false,
            note: f.note || '',
            message,
            createdAt: f.date,
          });
        }
      }
    }

    return { success: true, data: notifications };
  }
}
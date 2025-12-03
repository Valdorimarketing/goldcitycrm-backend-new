
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, DataSource } from 'typeorm';
import { BaseService } from '../../../core/base/services/base.service';
import { CustomerNote } from '../entities/customer-note.entity';
import { CustomerNoteRepository } from '../repositories/customer-note.repository';
import {
  CreateCustomerNoteDto,
  UpdateCustomerNoteDto,
  CustomerNoteResponseDto,
} from '../dto/create-customer-note.dto';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';

export interface CustomerNoteFilterOptions {
  customer?: number;
  user?: number;
  startDate?: Date;
  endDate?: Date;
  isReminding?: boolean;
  noteType?: string;
}

@Injectable()
export class CustomerNoteService extends BaseService<CustomerNote> {
  constructor(
    private readonly customerNoteRepository: CustomerNoteRepository,
    private readonly customerHistoryService: CustomerHistoryService,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {
    super(customerNoteRepository, CustomerNote);
  }

  async createCustomerNote(
    createCustomerNoteDto: CreateCustomerNoteDto,
    userId: number,
  ): Promise<CustomerNoteResponseDto> {
    if (!userId) {
      throw new Error('User ID is required for creating customer notes');
    }

    // Müşterinin mevcut durumunu kontrol et
    if (createCustomerNoteDto.customer) {
      try {
        const customerWithStatus = await this.customerRepo.findOne({
          where: { id: createCustomerNoteDto.customer },
          relations: ['statusData'],
        });
 
        

        if (customerWithStatus?.statusData?.name === 'TEKRAR ARANACAK') {
          const remindingDate = new Date();
          remindingDate.setDate(remindingDate.getDate() + customerWithStatus.statusData.remindingDay);

          await this.customerRepo.update(
            createCustomerNoteDto.customer,
            { remindingDate }
          );
        }
      } catch (error) {
        console.error('Error checking customer status for remindingDate:', error);
      }
    }

    const noteData = {
      ...createCustomerNoteDto,
      user: userId,
    };
    const note = await this.create(noteData, CustomerNoteResponseDto);

    await this.customerHistoryService.logCustomerAction(
      createCustomerNoteDto.customer,
      CustomerHistoryAction.NOTE_ADDED,
      `${createCustomerNoteDto.note}`,
      createCustomerNoteDto,
      null,
      userId,
      note.id,
    );

    return note;
  }

  async updateCustomerNote(
    id: number,
    updateCustomerNoteDto: UpdateCustomerNoteDto,
  ): Promise<CustomerNoteResponseDto> {
    return this.update(updateCustomerNoteDto, id, CustomerNoteResponseDto);
  }

  async getCustomerNoteById(id: number): Promise<CustomerNote> {
    return this.findOneById(id);
  }

  async getAllCustomerNotes(): Promise<CustomerNote[]> {
    return this.findAll();
  }

  async getCustomerNotesByCustomer(customerId: number): Promise<any[]> {
    const notes = await this.customerNoteRepository.findAll({
      where: { customer: customerId },
      order: { createdAt: 'DESC' },
      relations: ['userRelation']
    });

    return notes.map(note => {
      return {
        ...note,
        userInfo: note.userRelation || {
          id: note.customer,
          name: 'Müşteri',
        }
      }
    });
  }



  async getCustomerNotesByUser(userId: number): Promise<CustomerNote[]> {
    return this.customerNoteRepository.findAll({
      where: { user: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteCustomerNote(id: number, userId?: number): Promise<CustomerNote> {


    // Get file info before deletion
    const note = await this.getCustomerNoteById(id);


    // Log to customer history
    await this.customerHistoryService.logCustomerAction(
      note.customer,
      CustomerHistoryAction.NOTE_DELETED,
      `Not silindi: ${note.note}`,
      null,
      null,
      userId,
      id,
    );

    return this.remove(id);
  }

  async getCustomerNotesByDateRange(
    filters: CustomerNoteFilterOptions,
  ): Promise<CustomerNote[]> {
    const where: any = {};

    // Customer filtresi
    if (filters.customer) {
      where.customer = filters.customer;
    }

    // User filtresi
    if (filters.user) {
      where.user = filters.user;
    }

    // isReminding filtresi
    if (filters.isReminding !== undefined) {
      where.isReminding = filters.isReminding;
    }

    // noteType filtresi
    if (filters.noteType) {
      where.noteType = filters.noteType;
    }

    // Tarih filtresi
    if (filters.startDate && filters.endDate) {
      // Hem başlangıç hem bitiş tarihi varsa
      where.remindingAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      // Sadece başlangıç tarihi varsa
      where.remindingAt = MoreThanOrEqual(filters.startDate);
    } else if (filters.endDate) {
      // Sadece bitiş tarihi varsa
      where.remindingAt = LessThanOrEqual(filters.endDate);
    }

    return this.customerNoteRepository.findAll({
      where,
      order: { remindingAt: 'ASC' },
    });
  }
}

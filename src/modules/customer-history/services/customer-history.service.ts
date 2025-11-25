import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { CustomerHistory } from '../entities/customer-history.entity';
import { CustomerHistoryRepository } from '../repositories/customer-history.repository';
import {
  CreateCustomerHistoryDto,
  UpdateCustomerHistoryDto,
  CustomerHistoryResponseDto,
} from '../dto/create-customer-history.dto';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export interface CustomerHistoryFilterOptions {
  customer?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

interface HistoryQueryOptions {
  customer?: number;
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

@Injectable()
export class CustomerHistoryService extends BaseService<CustomerHistory> {
  constructor(
    private readonly customerHistoryRepository: CustomerHistoryRepository,
  ) {
    super(customerHistoryRepository, CustomerHistory);
  }

  async createCustomerHistory(
    createCustomerHistoryDto: CreateCustomerHistoryDto,
  ): Promise<CustomerHistoryResponseDto> {
    return this.create(createCustomerHistoryDto, CustomerHistoryResponseDto);
  }

  async updateCustomerHistory(
    id: number,
    updateCustomerHistoryDto: UpdateCustomerHistoryDto,
  ): Promise<CustomerHistoryResponseDto> {
    return this.update(
      updateCustomerHistoryDto,
      id,
      CustomerHistoryResponseDto,
    );
  }
  
  async findFirstByCustomerAndAction(
    customerId: number,
    action: string,
  ): Promise<CustomerHistory | null> {
    const rows = await this.customerHistoryRepository.findAll({
      where: { customer: customerId, action },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    return rows.length > 0 ? rows[0] : null;
  }

  async getCustomerHistoryWithPagination(options: HistoryQueryOptions) {
    const {
      customer,
      userId,
      action,
      startDate,
      endDate,
      skip = 0,
      take = 20,
    } = options;

    // Where koşullarını hazırla
    const where: any = {};
    
    if (customer) {
      where.customer = customer;
    }

    if (userId) {
      where.user = userId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    // Repository'den paginated sonuçları al
    const [data, total] = await this.customerHistoryRepository.findAndCount({
      where,
      relations: ['customerData', 'userInfo'], // customerData relation'ını yükle
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    // Response formatını oluştur
    const formattedData = data.map((history) => ({
      id: history.id,
      action: history.action,
      description: history.description,
      requestData: history.requestData,
      responseData: history.responseData,
      createdAt: history.createdAt,
      user: history.user,
      relatedId: history.relatedId,
      customer: history.customer, // customer ID
      customerData: history.customerData // customerData relation (Customer entity)
        ? {
            id: history.customerData.id,
            name: history.customerData.name,
            surname: history.customerData.surname,
          }
        : null,
    }));

    return {
      data: formattedData,
      total,
    };
  }

  async getCustomerHistoryById(id: number): Promise<CustomerHistory> {
    return this.findOneById(id);
  }

  async getAllCustomerHistory(): Promise<CustomerHistory[]> {
    return this.findAll();
  }

  async getCustomerHistoryByCustomer(customerId: number): Promise<any[]> {
    const data = await this.customerHistoryRepository.findAll({
      where: { customer: customerId },
      order: { createdAt: 'DESC' },
      relations: ['userInfo', 'customerData'],
    });
 
    return instanceToPlain(data, {
      excludeExtraneousValues: true,
      enableCircularCheck: true,
    }) as any[];
  }

  async getCustomerHistoryByDateRange(
    filters: CustomerHistoryFilterOptions,
  ): Promise<CustomerHistory[]> {
    const where: any = {};

    if (filters.customer) {
      where.customer = filters.customer;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThanOrEqual(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThanOrEqual(filters.endDate);
    }

    return this.customerHistoryRepository.findAll({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteCustomerHistory(id: number): Promise<CustomerHistory> {
    return this.remove(id);
  }

  async logCustomerAction(
    customerId: number,
    action: string,
    description?: string,
    requestData?: any,
    responseData?: any,
    userId?: number,
    relatedId?: number,
  ): Promise<CustomerHistory> {
    const historyData = {
      customer: customerId,
      user: userId,
      action,
      relatedId,
      description,
      requestData: requestData ? JSON.stringify(requestData) : null,
      responseData: responseData ? JSON.stringify(responseData) : null,
    }; 
    
    return this.create(
      historyData as CreateCustomerHistoryDto,
      CustomerHistory,
    );
  }
}
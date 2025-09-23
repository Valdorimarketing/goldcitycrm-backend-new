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

export interface CustomerHistoryFilterOptions {
  customer?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
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

  async getCustomerHistoryById(id: number): Promise<CustomerHistory> {
    return this.findOneById(id);
  }

  async getAllCustomerHistory(): Promise<CustomerHistory[]> {
    return this.findAll();
  }

  async getCustomerHistoryByCustomer(
    customerId: number,
  ): Promise<CustomerHistory[]> {
    return this.customerHistoryRepository.findAll({
      where: { customer: customerId },
      order: { createdAt: 'DESC' },
    });
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

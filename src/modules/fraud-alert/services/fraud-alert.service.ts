import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { FraudAlertRepository } from '../repositories/fraud-alert.repository';
import { CreateFraudAlertDto } from '../dto/create-fraud-alert.dto';
import { UpdateFraudAlertDto } from '../dto/update-fraud-alert.dto';
import { FraudAlertResponseDto } from '../dto/fraud-alert-response.dto';
import { FraudAlertQueryFilterDto } from '../dto/fraud-alert-query-filter.dto';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class FraudAlertService extends BaseService<FraudAlert> {
  constructor(private readonly fraudAlertRepository: FraudAlertRepository) {
    super(fraudAlertRepository, FraudAlert);
  }

  async findByFiltersBaseQuery(
    filters: FraudAlertQueryFilterDto,
  ): Promise<SelectQueryBuilder<FraudAlert>> {
    return this.fraudAlertRepository.findByFiltersBaseQuery(filters);
  }

  async createFraudAlert(
    createFraudAlertDto: CreateFraudAlertDto,
  ): Promise<FraudAlertResponseDto> {
    return this.create(createFraudAlertDto, FraudAlertResponseDto);
  }

  async updateFraudAlert(
    id: number,
    updateFraudAlertDto: UpdateFraudAlertDto,
  ): Promise<FraudAlertResponseDto> {
    return this.update(updateFraudAlertDto, id, FraudAlertResponseDto);
  }

  async getFraudAlertById(id: number): Promise<FraudAlert> {
    const fraudAlert = await this.findOneById(id);
    if (!fraudAlert) {
      throw new NotFoundException(`Fraud Alert with ID ${id} not found`);
    }
    return fraudAlert;
  }

  async getAllFraudAlerts(): Promise<FraudAlert[]> {
    return this.fraudAlertRepository.findAll();
  }

  async getFraudAlertsByUser(userId: number): Promise<FraudAlert[]> {
    return this.fraudAlertRepository.findByUser(userId);
  }

  async getUnreadFraudAlerts(userId?: number): Promise<FraudAlert[]> {
    return this.fraudAlertRepository.findUnread(userId);
  }

  async getUncheckedFraudAlerts(userId?: number): Promise<FraudAlert[]> {
    return this.fraudAlertRepository.findUnchecked(userId);
  }

  async markAsRead(id: number): Promise<FraudAlert> {
    const fraudAlert = await this.getFraudAlertById(id);
    if (!fraudAlert) {
      throw new NotFoundException(`Fraud Alert with ID ${id} not found`);
    }
    return this.fraudAlertRepository.markAsRead(id);
  }

  async markAsChecked(id: number): Promise<FraudAlert> {
    const fraudAlert = await this.getFraudAlertById(id);
    if (!fraudAlert) {
      throw new NotFoundException(`Fraud Alert with ID ${id} not found`);
    }
    return this.fraudAlertRepository.markAsChecked(id);
  }

  async markAllAsRead(userId?: number): Promise<void> {
    return this.fraudAlertRepository.markAllAsRead(userId);
  }

  async markAllAsChecked(userId?: number): Promise<void> {
    return this.fraudAlertRepository.markAllAsChecked(userId);
  }

  async deleteFraudAlert(id: number): Promise<FraudAlert> {
    const fraudAlert = await this.getFraudAlertById(id);
    if (!fraudAlert) {
      throw new NotFoundException(`Fraud Alert with ID ${id} not found`);
    }
    return this.remove(id);
  }

  async getUnreadCount(userId?: number): Promise<number> {
    const unreadAlerts = await this.getUnreadFraudAlerts(userId);
    return unreadAlerts.length;
  }

  async getUncheckedCount(userId?: number): Promise<number> {
    const uncheckedAlerts = await this.getUncheckedFraudAlerts(userId);
    return uncheckedAlerts.length;
  }
}

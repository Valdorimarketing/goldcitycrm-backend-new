import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { CustomerFile } from '../entities/customer-file.entity';
import { CustomerFileRepository } from '../repositories/customer-file.repository';
import {
  CreateCustomerFileDto,
  UpdateCustomerFileDto,
  CustomerFileResponseDto,
} from '../dto/create-customer-file.dto';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';

@Injectable()
export class CustomerFileService extends BaseService<CustomerFile> {
  constructor(
    private readonly customerFileRepository: CustomerFileRepository,
    private readonly customerHistoryService: CustomerHistoryService,
  ) {
    super(customerFileRepository, CustomerFile);
  }

  async createCustomerFile(
    createCustomerFileDto: CreateCustomerFileDto,
    userId?: number,
  ): Promise<CustomerFileResponseDto> {
    const file = await this.create(
      createCustomerFileDto,
      CustomerFileResponseDto,
    );

    // Log to customer history
    await this.customerHistoryService.logCustomerAction(
      createCustomerFileDto.customer,
      CustomerHistoryAction.FILE_ADDED,
      `Dosya yüklendi: ${createCustomerFileDto.file} - ${createCustomerFileDto.description || ''}`,
      createCustomerFileDto,
      null,
      userId,
      file.id,
    );

    return file;
  }

  async updateCustomerFile(
    id: number,
    updateCustomerFileDto: UpdateCustomerFileDto,
  ): Promise<CustomerFileResponseDto> {
    return this.update(updateCustomerFileDto, id, CustomerFileResponseDto);
  }

  async getCustomerFileById(id: number): Promise<CustomerFile> {
    return this.findOneById(id);
  }

  async getAllCustomerFiles(): Promise<CustomerFile[]> {
    return this.findAll();
  }

  async getCustomerFilesByCustomer(
    customerId: number,
  ): Promise<CustomerFile[]> {
    return this.customerFileRepository.findAll({
      where: { customer: customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteCustomerFile(id: number, userId?: number): Promise<CustomerFile> {
    // Get file info before deletion
    const file = await this.getCustomerFileById(id);

    // Delete the file
    const deletedFile = await this.remove(id);

    // Log to customer history
    await this.customerHistoryService.logCustomerAction(
      file.customer,
      CustomerHistoryAction.FILE_DELETED,
      `Dosya silindi: ${file.file} - ${file.description || ''}`,
      null,
      null,
      userId,
      id,
    );

    return deletedFile;
  }
}

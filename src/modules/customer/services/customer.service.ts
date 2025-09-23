import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Customer } from '../entities/customer.entity';
import { CustomerRepository } from '../repositories/customer.repository';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
} from '../dto/create-customer.dto';
import { CustomerDynamicFieldValueService } from '../../customer-dynamic-field-value/services/customer-dynamic-field-value.service';
import { CreateCustomerDynamicFieldValueDto } from '../../customer-dynamic-field-value/dto/create-customer-dynamic-field-value.dto';
import { CustomerStatusChangeRepository } from '../../customer-status-change/repositories/customer-status-change.repository';
import { FraudAlertService } from '../../fraud-alert/services/fraud-alert.service';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';

@Injectable()
export class CustomerService extends BaseService<Customer> {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly customerDynamicFieldValueService: CustomerDynamicFieldValueService,
    private readonly customerStatusChangeRepository: CustomerStatusChangeRepository,
    private readonly fraudAlertService: FraudAlertService,
    private readonly customerHistoryService: CustomerHistoryService,
  ) {
    super(customerRepository, Customer);
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.create(createCustomerDto, CustomerResponseDto);

    // Handle dynamic fields if provided
    if (
      createCustomerDto.dynamicFields &&
      createCustomerDto.dynamicFields.length > 0
    ) {
      const dynamicFieldValues: CreateCustomerDynamicFieldValueDto[] =
        createCustomerDto.dynamicFields.map((field) => ({
          customer: customer.id,
          customer_dynamic_field: field.customer_dynamic_field,
          file: field.file,
          name: field.name,
          type: field.type,
          options_data: field.options_data,
          order: field.order || 0,
        }));

      await this.customerDynamicFieldValueService.createMany(
        dynamicFieldValues,
      );
    }

    return customer;
  }

  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    // Get current customer to check status change
    const currentCustomer = await this.findOneById(id);
    const oldStatus = currentCustomer?.status;

    const customer = await this.update(
      updateCustomerDto,
      id,
      CustomerResponseDto,
    );

    // Check for status change and fraud detection
    if (
      updateCustomerDto.status &&
      oldStatus !== updateCustomerDto.status &&
      updateCustomerDto.user
    ) {
      // Log status change
      await this.customerStatusChangeRepository.create({
        user_id: updateCustomerDto.user,
        customer_id: id,
        old_status: oldStatus || 0,
        new_status: updateCustomerDto.status,
      });

      // Log to customer history
      await this.customerHistoryService.logCustomerAction(
        id,
        CustomerHistoryAction.STATUS_CHANGE,
        `Status changed from ${oldStatus || 0} to ${updateCustomerDto.status}`,
        { oldStatus: oldStatus || 0, newStatus: updateCustomerDto.status },
        null,
        updateCustomerDto.user,
      );

      // Check for fraud: 3 different customers with same status change in last 5 minutes
      const uniqueCustomerChanges =
        await this.customerStatusChangeRepository.getUniqueCustomerChangesCount(
          updateCustomerDto.user,
          updateCustomerDto.status,
          5, // 5 dakika içinde
        );

      console.log('Fraud Detection Check:', {
        userId: updateCustomerDto.user,
        status: updateCustomerDto.status,
        uniqueCustomerChanges,
        threshold: 3,
      });

      if (uniqueCustomerChanges >= 3) {
        // Create fraud alert
        await this.fraudAlertService.createFraudAlert({
          user: updateCustomerDto.user,
          message: `Kullanıcı ${updateCustomerDto.user} son 5 dakika içinde ${uniqueCustomerChanges} farklı müşterinin durumunu ${updateCustomerDto.status} olarak değiştirdi. Olası anormal aktivite tespit edildi.`,
          isRead: false,
          isChecked: false,
        });
      }
    }

    // Handle dynamic fields if provided
    if (updateCustomerDto.dynamicFields) {
      // Delete existing dynamic field values
      await this.customerDynamicFieldValueService.deleteByCustomerId(id);

      // Create new dynamic field values if provided
      if (updateCustomerDto.dynamicFields.length > 0) {
        const dynamicFieldValues: CreateCustomerDynamicFieldValueDto[] =
          updateCustomerDto.dynamicFields.map((field) => ({
            customer: id,
            customer_dynamic_field: field.customer_dynamic_field,
            file: field.file,
            name: field.name,
            type: field.type,
            options_data: field.options_data,
            order: field.order || 0,
          }));

        await this.customerDynamicFieldValueService.createMany(
          dynamicFieldValues,
        );
      }
    }

    return customer;
  }

  async getCustomerById(id: number): Promise<Customer> {
    return this.customerRepository.findOneWithDynamicFields(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return this.findAll();
  }

  async getCustomersByEmail(email: string): Promise<Customer[]> {
    return this.customerRepository.findByEmail(email);
  }

  async getCustomersByPhone(phone: string): Promise<Customer[]> {
    return this.customerRepository.findByPhone(phone);
  }

  async getCustomersByStatus(status: number): Promise<Customer[]> {
    return this.customerRepository.findByStatus(status);
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return this.customerRepository.findActiveCustomers();
  }

  async deleteCustomer(id: number): Promise<Customer> {
    // Delete dynamic field values first
    await this.customerDynamicFieldValueService.deleteByCustomerId(id);

    // Delete customer
    return this.remove(id);
  }
}

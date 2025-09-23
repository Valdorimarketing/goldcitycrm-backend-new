import { Injectable } from '@nestjs/common';
import { CustomerDynamicFieldValueRepository } from '../repositories/customer-dynamic-field-value.repository';
import { CreateCustomerDynamicFieldValueDto } from '../dto/create-customer-dynamic-field-value.dto';
import { UpdateCustomerDynamicFieldValueDto } from '../dto/update-customer-dynamic-field-value.dto';

@Injectable()
export class CustomerDynamicFieldValueService {
  constructor(
    private readonly customerDynamicFieldValueRepository: CustomerDynamicFieldValueRepository,
  ) {}

  async create(
    createCustomerDynamicFieldValueDto: CreateCustomerDynamicFieldValueDto,
  ) {
    return this.customerDynamicFieldValueRepository.save(
      createCustomerDynamicFieldValueDto,
    );
  }

  async createMany(
    createCustomerDynamicFieldValueDtos: CreateCustomerDynamicFieldValueDto[],
  ) {
    return this.customerDynamicFieldValueRepository.saveMany(
      createCustomerDynamicFieldValueDtos,
    );
  }

  async findAll() {
    return this.customerDynamicFieldValueRepository.findAll();
  }

  async findOne(id: number) {
    return this.customerDynamicFieldValueRepository.findOneById(id);
  }

  async update(
    id: number,
    updateCustomerDynamicFieldValueDto: UpdateCustomerDynamicFieldValueDto,
  ) {
    const entity = await this.findOne(id);
    return this.customerDynamicFieldValueRepository.save({
      ...entity,
      ...updateCustomerDynamicFieldValueDto,
    });
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    return this.customerDynamicFieldValueRepository.remove(entity);
  }

  async deleteByCustomerId(customerId: number) {
    return this.customerDynamicFieldValueRepository.deleteByCustomerId(
      customerId,
    );
  }
}

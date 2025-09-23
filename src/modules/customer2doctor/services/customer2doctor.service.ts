import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Customer2Doctor } from '../entities/customer2doctor.entity';
import { Customer2DoctorRepository } from '../repositories/customer2doctor.repository';
import { CreateCustomer2DoctorDto } from '../dto/create-customer2doctor.dto';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { CustomerService } from '../../customer/services/customer.service';

@Injectable()
export class Customer2DoctorService extends BaseService<Customer2Doctor> {
  constructor(
    private readonly customer2DoctorRepository: Customer2DoctorRepository,
    private readonly customerService: CustomerService,
  ) {
    super(customer2DoctorRepository, Customer2Doctor);
  }

  @LogMethod()
  async createCustomer2Doctor(
    createDto: CreateCustomer2DoctorDto,
  ): Promise<Customer2Doctor> {
    const existing =
      await this.customer2DoctorRepository.findByCustomerAndDoctor(
        createDto.customerId,
        createDto.doctorId,
      );

    if (existing) {
      return await this.update(createDto, existing.id, Customer2Doctor);
    }

    // Create the new customer2doctor record
    const result = await super.create(createDto, Customer2Doctor);

    // Update customer status to 5 when a new customer2doctor record is created
    await this.customerService.updateCustomer(createDto.customerId, {
      status: 5,
      user: createDto.user || null, // Use the user from DTO if available
    });

    return result;
  }

  @LogMethod()
  async findByCustomerId(customerId: number): Promise<Customer2Doctor[]> {
    return this.customer2DoctorRepository.findByCustomerId(customerId);
  }

  @LogMethod()
  async findByDoctorId(doctorId: number): Promise<Customer2Doctor[]> {
    return this.customer2DoctorRepository.findByDoctorId(doctorId);
  }

  @LogMethod()
  async findByCustomerAndDoctor(
    customerId: number,
    doctorId: number,
  ): Promise<Customer2Doctor> {
    const result = await this.customer2DoctorRepository.findByCustomerAndDoctor(
      customerId,
      doctorId,
    );
    if (!result) {
      throw new NotFoundException('Customer-Doctor relationship not found');
    }
    return result;
  }

  @LogMethod()
  async removeByCustomerAndDoctor(
    customerId: number,
    doctorId: number,
  ): Promise<void> {
    const relationship =
      await this.customer2DoctorRepository.findByCustomerAndDoctor(
        customerId,
        doctorId,
      );
    if (relationship) {
      await this.remove(relationship.id);
    }
  }
}

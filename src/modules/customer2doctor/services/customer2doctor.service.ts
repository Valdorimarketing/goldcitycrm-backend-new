import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Customer2Doctor } from '../entities/customer2doctor.entity';
import { Customer2DoctorRepository } from '../repositories/customer2doctor.repository';
import { CreateCustomer2DoctorDto } from '../dto/create-customer2doctor.dto';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { CustomerService } from '../../customer/services/customer.service';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';
import { DoctorService } from '../../doctor/services/doctor.service';

@Injectable()
export class Customer2DoctorService extends BaseService<Customer2Doctor> {
  constructor(
    private readonly customer2DoctorRepository: Customer2DoctorRepository,
    private readonly customerService: CustomerService,
    private readonly customerHistoryService: CustomerHistoryService,
    private readonly doctorService: DoctorService,
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

    // Get doctor name for history log
    const doctor = await this.doctorService.findById(createDto.doctorId);
    const doctorName = doctor?.name || 'Bilinmeyen Doktor';

    if (existing) {
      const result = await this.update(createDto, existing.id, Customer2Doctor);

      // Log to customer history for update
      await this.customerHistoryService.logCustomerAction(
        createDto.customerId,
        CustomerHistoryAction.CUSTOMER_UPDATED,
        `'${doctorName}' doktoru ile ilgili bilgiler güncellendi`,
        createDto,
        result,
        createDto.user,
      );

      // Log if doctor comment is added/updated
      if (createDto.doctorComment) {
        await this.customerHistoryService.logCustomerAction(
          createDto.customerId,
          CustomerHistoryAction.NOTE_ADDED,
          `'${doctorName}' doktoru için görüş eklendi/güncellendi`,
          { doctorComment: createDto.doctorComment },
          null,
          createDto.user,
        );
      }

      return result;
    }

    // Create the new customer2doctor record
    const result = await super.create(createDto, Customer2Doctor);

    // Log to customer history for creation
    await this.customerHistoryService.logCustomerAction(
      createDto.customerId,
      CustomerHistoryAction.CUSTOMER_UPDATED,
      `'${doctorName}' doktoru ile eşleştirme yapıldı`,
      createDto,
      result,
      createDto.user,
    );

    // Log if doctor comment is added
    if (createDto.doctorComment) {
      await this.customerHistoryService.logCustomerAction(
        createDto.customerId,
        CustomerHistoryAction.NOTE_ADDED,
        `'${doctorName}' doktoru için görüş eklendi`,
        { doctorComment: createDto.doctorComment },
        null,
        createDto.user,
      );
    }

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

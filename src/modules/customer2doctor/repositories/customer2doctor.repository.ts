import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Customer2Doctor } from '../entities/customer2doctor.entity';

@Injectable()
export class Customer2DoctorRepository extends BaseRepositoryAbstract<Customer2Doctor> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(Customer2Doctor));
  }

  async findByCustomerId(customerId: number): Promise<Customer2Doctor[]> {
    return this.createQueryBuilder('customer2doctor')
      .leftJoinAndSelect('customer2doctor.doctor', 'doctor')
      .leftJoinAndSelect('doctor.branch', 'branch')
      .leftJoinAndSelect('doctor.doctor2Hospitals', 'doctor2Hospitals')
      .leftJoinAndSelect('doctor2Hospitals.hospital', 'hospital')
      .leftJoinAndSelect('doctor.doctor2Branches', 'doctor2Branches')
      .leftJoinAndSelect('doctor2Branches.branch', 'doctorBranch')
      .leftJoinAndSelect('customer2doctor.customer', 'customer')
      .where('customer2doctor.customerId = :customerId', { customerId })
      .getMany();
  }

  async findByDoctorId(doctorId: number): Promise<Customer2Doctor[]> {
    return this.createQueryBuilder('customer2doctor')
      .leftJoinAndSelect('customer2doctor.customer', 'customer')
      .leftJoinAndSelect('customer2doctor.doctor', 'doctor')
      .where('customer2doctor.doctorId = :doctorId', { doctorId })
      .getMany();
  }

  async findByCustomerAndDoctor(
    customerId: number,
    doctorId: number,
  ): Promise<Customer2Doctor | null> {
    return this.createQueryBuilder('customer2doctor')
      .leftJoinAndSelect('customer2doctor.doctor', 'doctor')
      .leftJoinAndSelect('customer2doctor.customer', 'customer')
      .where('customer2doctor.customerId = :customerId', { customerId })
      .andWhere('customer2doctor.doctorId = :doctorId', { doctorId })
      .getOne();
  }
}

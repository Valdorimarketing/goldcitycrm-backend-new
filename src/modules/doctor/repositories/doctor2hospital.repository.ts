import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Doctor2Hospital } from '../entities/doctor2hospital.entity';

@Injectable()
export class Doctor2HospitalRepository extends BaseRepositoryAbstract<Doctor2Hospital> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(Doctor2Hospital));
  }

  async findDoctorsByHospitalId(
    hospitalId: number,
  ): Promise<Doctor2Hospital[]> {
    return this.getRepository()
      .createQueryBuilder('d2h')
      .leftJoinAndSelect('d2h.doctor', 'doctor')
      .leftJoinAndSelect('d2h.hospital', 'hospital')
      .where('d2h.hospitalId = :hospitalId', { hospitalId })
      .getMany();
  }

  async findHospitalsByDoctorId(doctorId: number): Promise<Doctor2Hospital[]> {
    return this.getRepository()
      .createQueryBuilder('d2h')
      .leftJoinAndSelect('d2h.doctor', 'doctor')
      .leftJoinAndSelect('d2h.hospital', 'hospital')
      .where('d2h.doctorId = :doctorId', { doctorId })
      .getMany();
  }

  async findDoctorIdsByHospitalId(hospitalId: number): Promise<number[]> {
    const results = await this.getRepository()
      .createQueryBuilder('d2h')
      .select('d2h.doctorId', 'doctorId')
      .where('d2h.hospitalId = :hospitalId', { hospitalId })
      .getRawMany();

    return results.map((r) => r.doctorId);
  }
}

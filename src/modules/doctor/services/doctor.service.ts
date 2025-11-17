import { Injectable } from '@nestjs/common';
import { Doctor } from '../entities/doctor.entity';
import { DoctorRepository } from '../repositories/doctor.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { DoctorQueryFilterDto } from '../dto/doctor-query-filter.dto';
import { SelectQueryBuilder } from 'typeorm';
import { Doctor2BranchRepository } from '../repositories/doctor2branch.repository';
import { Doctor2HospitalRepository } from '../repositories/doctor2hospital.repository';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/update-doctor.dto';

@Injectable()
export class DoctorService extends BaseService<Doctor> {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly doctor2BranchRepository: Doctor2BranchRepository,
    private readonly doctor2HospitalRepository: Doctor2HospitalRepository,
  ) {
    super(doctorRepository, Doctor);
  }

  @LogMethod()
  async findWithRelations(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findByCondition({
      where: { id },
      relations: [
        'branch',
        'doctor2Branches',
        'doctor2Branches.branch',
        'doctor2Hospitals',
        'doctor2Hospitals.hospital',
      ],
    });

    if (!doctor) {
      return null;
    }

    return doctor;
  }

  async findByFiltersBaseQuery(
    filters: DoctorQueryFilterDto,
  ): Promise<SelectQueryBuilder<Doctor>> {
    return this.doctorRepository.findByFiltersBaseQuery(filters);
  }

  @LogMethod()
  async findDoctorsByHospitalId(hospitalId: number): Promise<Doctor[]> {
    const doctor2Hospitals =
      await this.doctor2HospitalRepository.findDoctorsByHospitalId(hospitalId);
    return doctor2Hospitals.map((d2h) => d2h.doctor);
  }

  @LogMethod()
  async findHospitalsByDoctorId(doctorId: number): Promise<any[]> {
    const doctor2Hospitals =
      await this.doctor2HospitalRepository.findHospitalsByDoctorId(doctorId);
    return doctor2Hospitals.map((d2h) => d2h.hospital);
  }

  @LogMethod()
  async findDoctorsByHospitalAndBranch(
    hospitalId: number,
    branchId: number,
  ): Promise<Doctor[]> {
    try {
      // Hastanedeki doktor ID'lerini al
      const hospitalDoctorIds =
        await this.doctor2HospitalRepository.findDoctorIdsByHospitalId(
          hospitalId,
        );

      // Branch'teki doktor ID'lerini al
      const branchDoctorIds =
        await this.doctor2BranchRepository.findDoctorIdsByBranchId(branchId);

      // İki kümenin kesişimini bul
      const commonDoctorIds = hospitalDoctorIds.filter((id) =>
        branchDoctorIds.includes(id),
      );

      if (commonDoctorIds.length === 0) {
        return [];
      }

      // Ortak doktorların detaylı bilgilerini getir
      const allDoctors = [];
      for (const doctorId of commonDoctorIds) {
        const doctor = await this.doctorRepository.findByCondition({
          where: { id: doctorId },
          relations: [
            'branch',
            'doctor2Hospitals.hospital',
            'doctor2Branches.branch',
          ],
        });
        if (doctor) {
          allDoctors.push(doctor);
        }
      }
      return allDoctors;
    } catch (error) {
      console.error('Error in findDoctorsByHospitalAndBranch:', error);
      throw error;
    }
  }

  @LogMethod()
  async createDoctor(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { branchIds, hospitalIds, ...doctorData } = createDoctorDto;

    const doctor = await this.doctorRepository.save(doctorData);

    if (branchIds && branchIds.length > 0) {
      const doctor2Branches = branchIds.map((branchId) => ({
        doctorId: doctor.id,
        branchId,
      }));

      await this.doctor2BranchRepository.saveMany(doctor2Branches);
    }

    if (hospitalIds && hospitalIds.length > 0) {
      const doctor2Hospitals = hospitalIds.map((hospitalId) => ({
        doctorId: doctor.id,
        hospitalId,
      }));

      await this.doctor2HospitalRepository.saveMany(doctor2Hospitals);
    }

    return this.findById(doctor.id);
  }

  @LogMethod()
  async updateDoctor(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Doctor> {
    const { branchIds, hospitalIds, ...doctorData } = updateDoctorDto;

    await this.doctorRepository.update(id, doctorData);

    if (branchIds !== undefined) {
      await this.doctor2BranchRepository.removeByCondition({
        doctorId: id,
      });

      if (branchIds.length > 0) {
        const doctor2Branches = branchIds.map((branchId) => ({
          doctorId: id,
          branchId,
        }));

        await this.doctor2BranchRepository.saveMany(doctor2Branches);
      }
    }

    if (hospitalIds !== undefined) {
      await this.doctor2HospitalRepository.removeByCondition({
        doctorId: id,
      });

      if (hospitalIds.length > 0) {
        const doctor2Hospitals = hospitalIds.map((hospitalId) => ({
          doctorId: id,
          hospitalId,
        }));

        await this.doctor2HospitalRepository.saveMany(doctor2Hospitals);
      }
    }

    return this.findById(id);
  }

  @LogMethod()
  async findById(id: number): Promise<Doctor> {
    return this.doctorRepository.findByCondition({
      where: { id },
      relations: [
        'branch',
        'doctor2Branches',
        'doctor2Branches.branch',
        'doctor2Hospitals',
        'doctor2Hospitals.hospital',
      ],
    });
  }

  @LogMethod()
  async findAllWithRelations(query?: DoctorQueryFilterDto): Promise<Doctor[]> {
    const queryBuilder = await this.findByFiltersBaseQuery(query || {});
    queryBuilder
      .leftJoinAndSelect('doctor.branch', 'branch')
      .leftJoinAndSelect('doctor.doctor2Branches', 'doctor2Branches')
      .leftJoinAndSelect('doctor2Branches.branch', 'd2b_branch')
      .leftJoinAndSelect('doctor.doctor2Hospitals', 'doctor2Hospitals')
      .leftJoinAndSelect('doctor2Hospitals.hospital', 'd2h_hospital');

    return queryBuilder.getMany();
  }
}

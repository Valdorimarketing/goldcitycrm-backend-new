import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { DoctorRepository } from '../repositories/doctor.repository';
import { Doctor2Hospital } from '../entities/doctor2hospital.entity';
import { Doctor2Branch } from '../entities/doctor2branch.entity';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/update-doctor.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    @InjectRepository(Doctor2Hospital)
    private readonly doctor2HospitalRepository: Repository<Doctor2Hospital>,
    @InjectRepository(Doctor2Branch)
    private readonly doctor2BranchRepository: Repository<Doctor2Branch>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { hospitalIds, branchIds, ...doctorData } = createDoctorDto;
    
    const savedDoctor = await this.doctorRepository.save(doctorData);

    if (hospitalIds && hospitalIds.length > 0) {
      const hospitalRelations = hospitalIds.map(hospitalId => 
        this.doctor2HospitalRepository.create({
          doctorId: savedDoctor.id,
          hospitalId,
        })
      );
      await this.doctor2HospitalRepository.save(hospitalRelations);
    }

    if (branchIds && branchIds.length > 0) {
      const branchRelations = branchIds.map(branchId => 
        this.doctor2BranchRepository.create({
          doctorId: savedDoctor.id,
          branchId,
        })
      );
      await this.doctor2BranchRepository.save(branchRelations);
    }

    return this.doctorRepository.findWithRelations(savedDoctor.id);
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const { hospitalIds, branchIds, ...doctorData } = updateDoctorDto;
    
    if (Object.keys(doctorData).length > 0) {
      const doctor = await this.findById(id);
      Object.assign(doctor, doctorData);
      await this.doctorRepository.save(doctor);
    }

    if (hospitalIds !== undefined) {
      await this.doctor2HospitalRepository.delete({ doctorId: id });
      
      if (hospitalIds.length > 0) {
        const hospitalRelations = hospitalIds.map(hospitalId => 
          this.doctor2HospitalRepository.create({
            doctorId: id,
            hospitalId,
          })
        );
        await this.doctor2HospitalRepository.save(hospitalRelations);
      }
    }

    if (branchIds !== undefined) {
      await this.doctor2BranchRepository.delete({ doctorId: id });
      
      if (branchIds.length > 0) {
        const branchRelations = branchIds.map(branchId => 
          this.doctor2BranchRepository.create({
            doctorId: id,
            branchId,
          })
        );
        await this.doctor2BranchRepository.save(branchRelations);
      }
    }

    return this.doctorRepository.findWithRelations(id);
  }

  async paginate(query: BaseQueryFilterDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.doctorRepository.createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.branch', 'branch')
      .leftJoinAndSelect('doctor.hospitalRelations', 'hospitalRelations')
      .leftJoinAndSelect('hospitalRelations.hospital', 'hospital')
      .leftJoinAndSelect('doctor.branchRelations', 'branchRelations')
      .leftJoinAndSelect('branchRelations.branch', 'relatedBranch')
      .skip(skip)
      .take(limit)
      .orderBy('doctor.id', query.order || 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<Doctor> {
    return this.doctorRepository.findWithRelations(id);
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.findAllWithRelations();
  }

  async remove(id: number): Promise<void> {
    const doctor = await this.findById(id);
    await this.doctorRepository.remove(doctor);
  }
}
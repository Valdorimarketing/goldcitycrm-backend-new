import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Doctor } from '../entities/doctor.entity';
import { DoctorQueryFilterDto } from '../dto/doctor-query-filter.dto';

@Injectable()
export class DoctorRepository extends BaseRepositoryAbstract<Doctor> {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {
    super(doctorRepository);
  }

  async findByFiltersBaseQuery(
    filters: DoctorQueryFilterDto,
  ): Promise<SelectQueryBuilder<Doctor>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // ✅ Search functionality
    if (filters.search) {
      queryBuilder.andWhere('doctor.name LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    // ✅ Filter by branch ID
    if (filters.branchId) {
      queryBuilder.andWhere(
        '(doctor.branchId = :branchId OR EXISTS (SELECT 1 FROM doctor2branch d2b WHERE d2b.doctor = doctor.id AND d2b.branch = :branchId))',
        { branchId: filters.branchId }
      );
    }

    // ✅ Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    // Clear default sorting first
    queryBuilder.orderBy();

    switch (sortBy) {
      case 'name':
        queryBuilder.orderBy('doctor.name', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('doctor.createdAt', sortOrder);
        break;
      case 'updatedAt':
        queryBuilder.orderBy('doctor.updatesAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('doctor.createdAt', 'DESC');
    }

    return queryBuilder;
  }

  async findWithRelations(id: number): Promise<Doctor> {
    return this.doctorRepository.findOne({
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

  async findAllWithRelations(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['branch'],
    });
  }
}
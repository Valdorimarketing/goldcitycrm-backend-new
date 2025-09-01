import { Injectable } from '@nestjs/common';
import { Hospital } from '../entities/hospital.entity';
import { HospitalRepository } from '../repositories/hospital.repository';
import { CreateHospitalDto } from '../dto/create-hospital.dto';
import { UpdateHospitalDto } from '../dto/update-hospital.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';

@Injectable()
export class HospitalService {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async create(createHospitalDto: CreateHospitalDto): Promise<Hospital> {
    return this.hospitalRepository.save(createHospitalDto);
  }

  async findAll(): Promise<Hospital[]> {
    return this.hospitalRepository.findAll();
  }

  async paginate(query: BaseQueryFilterDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.hospitalRepository.findAll({
      skip,
      take: limit,
      order: { id: query.order || 'DESC' },
    }).then(async (items) => {
      const allItems = await this.hospitalRepository.findAll();
      return [items, allItems.length];
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<Hospital> {
    return this.hospitalRepository.findOneById(id);
  }

  async update(id: number, updateHospitalDto: UpdateHospitalDto): Promise<Hospital> {
    const hospital = await this.findById(id);
    Object.assign(hospital, updateHospitalDto);
    return this.hospitalRepository.save(hospital);
  }

  async remove(id: number): Promise<void> {
    const hospital = await this.findById(id);
    await this.hospitalRepository.remove(hospital);
  }
}
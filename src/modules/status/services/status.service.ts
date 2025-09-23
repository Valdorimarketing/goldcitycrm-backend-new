import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Status } from '../entities/status.entity';
import { StatusRepository } from '../repositories/status.repository';
import { CreateStatusDto } from '../dto/create-status.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

@Injectable()
export class StatusService extends BaseService<Status> {
  constructor(private readonly statusRepository: StatusRepository) {
    super(statusRepository, Status);
  }

  async createStatus(createStatusDto: CreateStatusDto): Promise<Status> {
    return this.repository.save(createStatusDto);
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateStatusDto,
  ): Promise<Status> {
    const status = await this.findOneById(id);
    Object.assign(status, updateStatusDto);
    return this.repository.save(status);
  }

  async getStatusById(id: number): Promise<Status> {
    return this.findOneById(id);
  }

  async getAllStatuses(): Promise<Status[]> {
    return this.findAll();
  }

  async getActiveStatuses(): Promise<Status[]> {
    return this.statusRepository.findActive();
  }

  async deleteStatus(id: number): Promise<Status> {
    return this.remove(id);
  }
}

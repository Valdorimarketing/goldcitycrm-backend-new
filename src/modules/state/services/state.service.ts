import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { State } from '../entities/state.entity';
import { StateRepository } from '../repositories/state.repository';
import { CreateStateDto, UpdateStateDto, StateResponseDto } from '../dto/create-state.dto';

@Injectable()
export class StateService extends BaseService<State> {
  constructor(private readonly stateRepository: StateRepository) {
    super(stateRepository, State);
  }

  async createState(createStateDto: CreateStateDto): Promise<StateResponseDto> {
    return this.create(createStateDto, StateResponseDto);
  }

  async updateState(id: number, updateStateDto: UpdateStateDto): Promise<StateResponseDto> {
    return this.update(updateStateDto, id, StateResponseDto);
  }

  async getStateById(id: number): Promise<State> {
    return this.findOneById(id);
  }

  async getAllStates(): Promise<State[]> {
    return this.findAll();
  }

  async getStatesByName(name: string): Promise<State[]> {
    return this.stateRepository.findByName(name);
  }

  async getStatesByCountry(countryId: number): Promise<State[]> {
    return this.stateRepository.findByCountry(countryId);
  }

  async deleteState(id: number): Promise<State> {
    return this.remove(id);
  }
} 
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StateService } from '../services/state.service';
import {
  CreateStateDto,
  UpdateStateDto,
  StateResponseDto,
} from '../dto/create-state.dto';
import { State } from '../entities/state.entity';

@Controller('states')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Post()
  async create(
    @Body() createStateDto: CreateStateDto,
  ): Promise<StateResponseDto> {
    return this.stateService.createState(createStateDto);
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('country') country?: string,
  ): Promise<State[]> {
    if (name) {
      return this.stateService.getStatesByName(name);
    }
    if (country) {
      return this.stateService.getStatesByCountry(+country);
    }
    return this.stateService.getAllStates();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<State> {
    return this.stateService.getStateById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStateDto: UpdateStateDto,
  ): Promise<StateResponseDto> {
    return this.stateService.updateState(+id, updateStateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<State> {
    return this.stateService.deleteState(+id);
  }
}

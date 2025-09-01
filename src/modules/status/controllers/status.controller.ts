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
import { StatusService } from '../services/status.service';
import { CreateStatusDto } from '../dto/create-status.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { Status } from '../entities/status.entity';

@Controller('statuses')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  async create(@Body() createStatusDto: CreateStatusDto): Promise<Status> {
    return this.statusService.createStatus(createStatusDto);
  }

  @Get()
  async findAll(@Query('active') active?: string): Promise<Status[]> {
    if (active === 'true') {
      return this.statusService.getActiveStatuses();
    }
    return this.statusService.getAllStatuses();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Status> {
    return this.statusService.getStatusById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<Status> {
    return this.statusService.updateStatus(+id, updateStatusDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Status> {
    return this.statusService.deleteStatus(+id);
  }
}
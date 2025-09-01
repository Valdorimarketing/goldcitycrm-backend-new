import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { HospitalService } from '../services/hospital.service';
import { CreateHospitalDto } from '../dto/create-hospital.dto';
import { UpdateHospitalDto } from '../dto/update-hospital.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';

@Controller('hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalService.create(createHospitalDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryFilterDto) {
    return this.hospitalService.paginate(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hospitalService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto) {
    return this.hospitalService.update(+id, updateHospitalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hospitalService.remove(+id);
  }
}
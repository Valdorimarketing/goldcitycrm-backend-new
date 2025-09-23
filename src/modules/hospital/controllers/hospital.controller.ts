import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HospitalService } from '../services/hospital.service';
import { CreateHospitalDto } from '../dto/create-hospital.dto';
import { UpdateHospitalDto } from '../dto/update-hospital.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Hospital } from '../entities/hospital.entity';

@ApiTags('hospitals')
@ApiBearerAuth('JWT-auth')
@Controller('hospitals')
@UseGuards(JwtAuthGuard)
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hospital' })
  @ApiResponse({
    status: 201,
    description: 'Hospital created successfully',
    type: Hospital,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createHospitalDto: CreateHospitalDto,
  ): Promise<Hospital> {
    return this.hospitalService.create(createHospitalDto, Hospital);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hospitals with pagination' })
  @ApiResponse({ status: 200, description: 'Hospitals retrieved successfully' })
  async findAll(@Query() query: BaseQueryFilterDto) {
    const queryBuilder =
      await this.hospitalService.findByFiltersBaseQuery(query);
    return this.hospitalService.paginate(queryBuilder, query, Hospital);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hospital by ID' })
  @ApiResponse({
    status: 200,
    description: 'Hospital retrieved successfully',
    type: Hospital,
  })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async findOne(@Param('id') id: string): Promise<Hospital> {
    return this.hospitalService.findById(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a hospital' })
  @ApiResponse({
    status: 200,
    description: 'Hospital updated successfully',
    type: Hospital,
  })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async update(
    @Param('id') id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ): Promise<Hospital> {
    return this.hospitalService.update(updateHospitalDto, +id, Hospital);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hospital' })
  @ApiResponse({ status: 200, description: 'Hospital deleted successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async remove(@Param('id') id: string): Promise<Hospital> {
    return this.hospitalService.remove(+id);
  }
}

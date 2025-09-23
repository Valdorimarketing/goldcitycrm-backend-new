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
import { DoctorToHospitalService } from '../services/doctor-to-hospital.service';
import { CreateDoctorToHospitalDto } from '../dto/create-doctor-to-hospital.dto';
import { UpdateDoctorToHospitalDto } from '../dto/update-doctor-to-hospital.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorToHospital } from '../entities/doctor-to-hospital.entity';

@ApiTags('doctor-to-hospital')
@ApiBearerAuth('JWT-auth')
@Controller('doctor-to-hospital')
@UseGuards(JwtAuthGuard)
export class DoctorToHospitalController {
  constructor(
    private readonly doctorToHospitalService: DoctorToHospitalService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new doctor-hospital relation' })
  @ApiResponse({
    status: 201,
    description: 'Relation created successfully',
    type: DoctorToHospital,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createDto: CreateDoctorToHospitalDto,
  ): Promise<DoctorToHospital> {
    return this.doctorToHospitalService.create(createDto, DoctorToHospital);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all doctor-hospital relations with pagination',
  })
  @ApiResponse({ status: 200, description: 'Relations retrieved successfully' })
  async findAll(@Query() query: BaseQueryFilterDto) {
    const queryBuilder =
      await this.doctorToHospitalService.findByFiltersBaseQuery(query);
    queryBuilder.leftJoinAndSelect('doctortohospital.doctor', 'doctor');
    queryBuilder.leftJoinAndSelect('doctortohospital.hospital', 'hospital');
    return this.doctorToHospitalService.paginate(
      queryBuilder,
      query,
      DoctorToHospital,
    );
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get all hospitals for a doctor' })
  @ApiResponse({
    status: 200,
    description: 'Relations retrieved successfully',
    type: [DoctorToHospital],
  })
  async findByDoctorId(
    @Param('doctorId') doctorId: string,
  ): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalService.findByDoctorId(+doctorId);
  }

  @Get('hospital/:hospitalId')
  @ApiOperation({ summary: 'Get all doctors for a hospital' })
  @ApiResponse({
    status: 200,
    description: 'Relations retrieved successfully',
    type: [DoctorToHospital],
  })
  async findByHospitalId(
    @Param('hospitalId') hospitalId: string,
  ): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalService.findByHospitalId(+hospitalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor-hospital relation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Relation retrieved successfully',
    type: DoctorToHospital,
  })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  async findOne(@Param('id') id: string): Promise<DoctorToHospital> {
    return this.doctorToHospitalService.findWithRelations(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor-hospital relation' })
  @ApiResponse({
    status: 200,
    description: 'Relation updated successfully',
    type: DoctorToHospital,
  })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDoctorToHospitalDto,
  ): Promise<DoctorToHospital> {
    return this.doctorToHospitalService.update(
      updateDto,
      +id,
      DoctorToHospital,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor-hospital relation' })
  @ApiResponse({ status: 200, description: 'Relation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  async remove(@Param('id') id: string): Promise<DoctorToHospital> {
    return this.doctorToHospitalService.remove(+id);
  }
}

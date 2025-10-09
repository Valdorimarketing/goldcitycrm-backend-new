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
import { DoctorService } from '../services/doctor.service';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/update-doctor.dto';
import { DoctorQueryFilterDto } from '../dto/doctor-query-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Doctor } from '../entities/doctor.entity';

@ApiTags('doctors')
@ApiBearerAuth('JWT-auth')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new doctor' })
  @ApiResponse({
    status: 201,
    description: 'Doctor created successfully',
    type: Doctor,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    return this.doctorService.createDoctor(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors with pagination and search' })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  async findAll(@Query() query: DoctorQueryFilterDto) {
    const queryBuilder = await this.doctorService.findByFiltersBaseQuery(query);
    queryBuilder.leftJoinAndSelect('doctor.branch', 'branch');
    return this.doctorService.paginate(queryBuilder, query, Doctor);
  }

  @Get('with-relations')
  @ApiOperation({ summary: 'Get all doctors with relations' })
  @ApiResponse({
    status: 200,
    description: 'Doctors retrieved successfully',
    type: [Doctor],
  })
  async findAllWithRelations(): Promise<Doctor[]> {
    return this.doctorService.findAllWithRelations();
  }

  @Get('by-hospital-and-branch')
  @ApiOperation({ summary: 'Get doctors by hospital and branch intersection' })
  @ApiResponse({
    status: 200,
    description: 'Doctors retrieved successfully',
    type: [Doctor],
  })
  async findByHospitalAndBranch(
    @Query('hospitalId') hospitalId: string,
    @Query('branchId') branchId: string,
  ): Promise<Doctor[]> {
    try {
      console.log(
        'Controller received - hospitalId:',
        hospitalId,
        'branchId:',
        branchId,
      );
      const result = await this.doctorService.findDoctorsByHospitalAndBranch(
        +hospitalId,
        +branchId,
      );
      console.log('Controller returning result:', result);
      return result;
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor by ID' })
  @ApiResponse({
    status: 200,
    description: 'Doctor retrieved successfully',
    type: Doctor,
  })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.findWithRelations(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor' })
  @ApiResponse({
    status: 200,
    description: 'Doctor updated successfully',
    type: Doctor,
  })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<Doctor> {
    return this.doctorService.updateDoctor(+id, updateDoctorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor' })
  @ApiResponse({ status: 200, description: 'Doctor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async remove(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.remove(+id);
  }
}

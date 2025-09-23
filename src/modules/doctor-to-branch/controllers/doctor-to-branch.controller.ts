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
import { DoctorToBranchService } from '../services/doctor-to-branch.service';
import { CreateDoctorToBranchDto } from '../dto/create-doctor-to-branch.dto';
import { UpdateDoctorToBranchDto } from '../dto/update-doctor-to-branch.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorToBranch } from '../entities/doctor-to-branch.entity';

@ApiTags('doctor-to-branch')
@ApiBearerAuth('JWT-auth')
@Controller('doctor-to-branch')
@UseGuards(JwtAuthGuard)
export class DoctorToBranchController {
  constructor(private readonly doctorToBranchService: DoctorToBranchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new doctor-branch relation' })
  @ApiResponse({
    status: 201,
    description: 'Relation created successfully',
    type: DoctorToBranch,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createDto: CreateDoctorToBranchDto,
  ): Promise<DoctorToBranch> {
    return this.doctorToBranchService.create(createDto, DoctorToBranch);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctor-branch relations with pagination' })
  @ApiResponse({ status: 200, description: 'Relations retrieved successfully' })
  async findAll(@Query() query: BaseQueryFilterDto) {
    const queryBuilder =
      await this.doctorToBranchService.findByFiltersBaseQuery(query);
    queryBuilder.leftJoinAndSelect('doctorToBranch.doctor', 'doctor');
    queryBuilder.leftJoinAndSelect('doctorToBranch.branch', 'branch');
    return this.doctorToBranchService.paginate(
      queryBuilder,
      query,
      DoctorToBranch,
    );
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get all branches for a doctor' })
  @ApiResponse({
    status: 200,
    description: 'Relations retrieved successfully',
    type: [DoctorToBranch],
  })
  async findByDoctorId(
    @Param('doctorId') doctorId: string,
  ): Promise<DoctorToBranch[]> {
    return this.doctorToBranchService.findByDoctorId(+doctorId);
  }

  @Get('branch/:branchId')
  @ApiOperation({ summary: 'Get all doctors for a branch' })
  @ApiResponse({
    status: 200,
    description: 'Relations retrieved successfully',
    type: [DoctorToBranch],
  })
  async findByBranchId(
    @Param('branchId') branchId: string,
  ): Promise<DoctorToBranch[]> {
    return this.doctorToBranchService.findByBranchId(+branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor-branch relation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Relation retrieved successfully',
    type: DoctorToBranch,
  })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  async findOne(@Param('id') id: string): Promise<DoctorToBranch> {
    return this.doctorToBranchService.findWithRelations(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor-branch relation' })
  @ApiResponse({
    status: 200,
    description: 'Relation updated successfully',
    type: DoctorToBranch,
  })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDoctorToBranchDto,
  ): Promise<DoctorToBranch> {
    return this.doctorToBranchService.update(updateDto, +id, DoctorToBranch);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor-branch relation' })
  @ApiResponse({ status: 200, description: 'Relation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  async remove(@Param('id') id: string): Promise<DoctorToBranch> {
    return this.doctorToBranchService.remove(+id);
  }
}

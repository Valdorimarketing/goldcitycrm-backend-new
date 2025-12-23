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
import { BranchService } from '../services/branch.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchQueryFilterDto } from '../dto/branch-query-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Branch } from '../entities/branch.entity';

@ApiTags('branches')
@ApiBearerAuth('JWT-auth')
@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully',
    type: Branch,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createBranchDto: CreateBranchDto): Promise<Branch> {
    console.log('📥 Received DTO:', JSON.stringify(createBranchDto, null, 2)); // ✅ Debug log
    return this.branchService.createBranch(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination and search' })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  async findAll(@Query() query: BranchQueryFilterDto) {
    return this.branchService.findAllPaginated(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch retrieved successfully',
    type: Branch,
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async findOne(@Param('id') id: string): Promise<Branch> {
    return this.branchService.findById(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({
    status: 200,
    description: 'Branch updated successfully',
    type: Branch,
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<Branch> {
    return this.branchService.updateBranch(+id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async remove(@Param('id') id: string): Promise<Branch> {
    return this.branchService.remove(+id);
  }
}
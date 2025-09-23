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
import { CustomerService } from '../services/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
} from '../dto/create-customer.dto';
import { Customer } from '../entities/customer.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';
import { Public } from '../../../core/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with optional filters' })
  @ApiQuery({ name: 'email', required: false, description: 'Filter by email' })
  @ApiQuery({ name: 'phone', required: false, description: 'Filter by phone' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Filter by active state',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
    type: [Customer],
  })
  async findAll(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: string,
    @Query('active') active?: string,
  ): Promise<Customer[]> {
    if (email) {
      return this.customerService.getCustomersByEmail(email);
    }
    if (phone) {
      return this.customerService.getCustomersByPhone(phone);
    }
    if (status) {
      return this.customerService.getCustomersByStatus(+status);
    }
    if (active === 'true') {
      return this.customerService.getActiveCustomers();
    }
    return this.customerService.getAllCustomers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customerService.getCustomerById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUserId() userId: number,
  ): Promise<CustomerResponseDto> {
    // User ID'yi DTO'ya ekle
    const dtoWithUser = {
      ...updateCustomerDto,
      user: userId,
    };

    return this.customerService.updateCustomer(+id, dtoWithUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Customer> {
    return this.customerService.deleteCustomer(+id);
  }
}

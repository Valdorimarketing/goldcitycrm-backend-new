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
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto } from '../dto/create-customer.dto';
import { Customer } from '../entities/customer.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';
import { Public } from '../../../core/decorators/public.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard) // Tüm controller JWT korumalı
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get()
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
      user: userId
    };
    
    return this.customerService.updateCustomer(+id, dtoWithUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Customer> {
    return this.customerService.deleteCustomer(+id);
  }
} 
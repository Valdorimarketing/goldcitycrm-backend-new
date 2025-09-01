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
import { CustomerHistoryService } from '../services/customer-history.service';
import { CreateCustomerHistoryDto, UpdateCustomerHistoryDto, CustomerHistoryResponseDto } from '../dto/create-customer-history.dto';
import { CustomerHistory } from '../entities/customer-history.entity';

@Controller('customer-history')
export class CustomerHistoryController {
  constructor(private readonly customerHistoryService: CustomerHistoryService) {}

  @Post()
  async create(@Body() createCustomerHistoryDto: CreateCustomerHistoryDto): Promise<CustomerHistoryResponseDto> {
    return this.customerHistoryService.createCustomerHistory(createCustomerHistoryDto);
  }

  @Get()
  async findAll(
    @Query('customer') customer?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CustomerHistory[]> {
    // Tarih filtrelemesi varsa
    if (startDate || endDate || action) {
      let startDateTime = undefined;
      let endDateTime = undefined;
      
      if (startDate) {
        startDateTime = new Date(startDate);
        if (startDate.length === 10) {
          startDateTime.setHours(0, 0, 0, 0);
        }
      }
      
      if (endDate) {
        endDateTime = new Date(endDate);
        if (endDate.length === 10) {
          endDateTime.setHours(23, 59, 59, 999);
        }
      }
      
      return this.customerHistoryService.getCustomerHistoryByDateRange({
        customer: customer ? +customer : undefined,
        action,
        startDate: startDateTime,
        endDate: endDateTime,
      });
    }
    
    if (customer) {
      return this.customerHistoryService.getCustomerHistoryByCustomer(+customer);
    }
    
    return this.customerHistoryService.getAllCustomerHistory();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerHistory> {
    return this.customerHistoryService.getCustomerHistoryById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerHistoryDto: UpdateCustomerHistoryDto,
  ): Promise<CustomerHistoryResponseDto> {
    return this.customerHistoryService.updateCustomerHistory(+id, updateCustomerHistoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<CustomerHistory> {
    return this.customerHistoryService.deleteCustomerHistory(+id);
  }
}
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import {
  CreateSalesDto,
  UpdateSalesDto,
  SalesResponseDto,
} from '../dto/create-sales.dto';
import { SalesQueryFilterDto } from '../dto/sales-query-filter.dto';
import { Sales } from '../entities/sales.entity';
import { PaginatedResponse } from '../../../core/base/interfaces/paginated-response.interface';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async create(
    @Body() createSalesDto: CreateSalesDto,
    @Request() req: any,
  ): Promise<SalesResponseDto> {
    const userId = req.user?.id;
    return this.salesService.createSales(createSalesDto, userId);
  }

  @Get('without-appointment')
  async findSalesWithoutAppointment(): Promise<Sales[]> {
    return this.salesService.getSalesWithoutAppointment();
  }

  @Get('teams-summary')
  async getAllTeamsSummary() {
    return this.salesService.getAllTeamsSummary();
  }

  @Get('customer/:customerId/products')
  async getCustomerSalesProducts(@Param('customerId') customerId: string) {
    return this.salesService.getCustomerSalesProducts(+customerId);
  }

  @Get('user/details')
  async getUserSalesWithDetails(
    @Query() query: SalesQueryFilterDto,
  ): Promise<PaginatedResponse<Sales>> {
    return this.salesService.getUserSalesWithDetails(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Sales> {
    return this.salesService.getSalesById(+id);
  }

  @Get(':id/products')
  async getSalesProducts(@Param('id') id: string) {
    return this.salesService.getSalesProducts(+id);
  }

  @Get()
  async findAll(
    @Query('customer') customer?: string,
    @Query('user') user?: string,
    @Query('responsibleUser') responsibleUser?: string,
  ): Promise<Sales[]> {
    if (customer) {
      return this.salesService.getSalesByCustomer(+customer);
    }
    if (user) {
      return this.salesService.getSalesByUser(+user);
    }
    if (responsibleUser) {
      return this.salesService.getSalesByResponsibleUser(+responsibleUser);
    }
    return this.salesService.getAllSales();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSalesDto: UpdateSalesDto,
  ): Promise<SalesResponseDto> {
    return this.salesService.updateSales(+id, updateSalesDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Sales> {
    return this.salesService.deleteSales(+id);
  }
}
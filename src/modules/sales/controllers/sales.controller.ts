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
import { Sales } from '../entities/sales.entity';

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

  @Get('customer/:customerId/products')
  async getCustomerSalesProducts(@Param('customerId') customerId: string) {
    return this.salesService.getCustomerSalesProducts(+customerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Sales> {
    return this.salesService.getSalesById(+id);
  }

  @Get(':id/products')
  async getSalesProducts(@Param('id') id: string) {
    return this.salesService.getSalesProducts(+id);
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

  @Post('test-action-list')
  async testActionList(): Promise<any> {
    return this.salesService.testActionListFeature();
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DataleadService } from '../services/datalead.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { CreateDataleadCustomerDto } from '../dto/create-datalead-customer.dto';

@Controller('datalead')
export class DataleadController {
  constructor(private readonly dataleadService: DataleadService) {}

  @UseGuards(ApiKeyGuard)
  @Post('customers')
  async createCustomer(@Body() createDto: CreateDataleadCustomerDto) {
    const result = await this.dataleadService.createCustomerFromDatalead(createDto);
    return {
      success: true,
      message: 'Customer successfully created.',
      data: result,
    };
  }
}

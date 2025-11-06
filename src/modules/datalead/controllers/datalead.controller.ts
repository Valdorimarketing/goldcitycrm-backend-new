import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DataleadService } from '../services/datalead.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { CreateDataleadCustomerDto } from '../dto/create-datalead-customer.dto';
import { Public } from 'src/core/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('datalead')
export class DataleadController {
  constructor(private readonly dataleadService: DataleadService) {}

  @Public() // ✅ JWT Auth'tan muaf
  @UseGuards(ApiKeyGuard)
  @Throttle({
    default: {
      limit: 1000, // izin verilen maksimum istek
      ttl: 60, // saniye cinsinden süre (1 dakika)
    },
  })
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

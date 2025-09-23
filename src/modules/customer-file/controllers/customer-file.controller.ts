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
import { CustomerFileService } from '../services/customer-file.service';
import {
  CreateCustomerFileDto,
  UpdateCustomerFileDto,
  CustomerFileResponseDto,
} from '../dto/create-customer-file.dto';
import { CustomerFile } from '../entities/customer-file.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';

@Controller('customer-files')
@UseGuards(JwtAuthGuard)
export class CustomerFileController {
  constructor(private readonly customerFileService: CustomerFileService) {}

  @Post()
  async create(
    @Body() createCustomerFileDto: CreateCustomerFileDto,
    @CurrentUserId() userId: number,
  ): Promise<CustomerFileResponseDto> {
    return this.customerFileService.createCustomerFile(
      createCustomerFileDto,
      userId,
    );
  }

  @Get()
  async findAll(@Query('customer') customer?: string): Promise<CustomerFile[]> {
    if (customer) {
      return this.customerFileService.getCustomerFilesByCustomer(+customer);
    }
    return this.customerFileService.getAllCustomerFiles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerFile> {
    return this.customerFileService.getCustomerFileById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerFileDto: UpdateCustomerFileDto,
  ): Promise<CustomerFileResponseDto> {
    return this.customerFileService.updateCustomerFile(
      +id,
      updateCustomerFileDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<CustomerFile> {
    return this.customerFileService.deleteCustomerFile(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomerDynamicFieldService } from '../services/customer-dynamic-field.service';
import { CreateCustomerDynamicFieldDto } from '../dto/create-customer-dynamic-field.dto';
import { UpdateCustomerDynamicFieldDto } from '../dto/update-customer-dynamic-field.dto';
import { CustomerDynamicField } from '../entities/customer-dynamic-field.entity';

@Controller('customer-dynamic-fields')
export class CustomerDynamicFieldController {
  constructor(
    private readonly customerDynamicFieldService: CustomerDynamicFieldService,
  ) {}

  @Post()
  create(@Body() createCustomerDynamicFieldDto: CreateCustomerDynamicFieldDto) {
    return this.customerDynamicFieldService.create(createCustomerDynamicFieldDto, CustomerDynamicField);
  }

  @Get()
  findAll() {
    return this.customerDynamicFieldService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerDynamicFieldService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDynamicFieldDto: UpdateCustomerDynamicFieldDto,
  ) {
    return this.customerDynamicFieldService.update(updateCustomerDynamicFieldDto, id, CustomerDynamicField);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerDynamicFieldService.remove(id);
  }
}

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
import { CustomerDynamicFieldValueService } from '../services/customer-dynamic-field-value.service';
import { CreateCustomerDynamicFieldValueDto } from '../dto/create-customer-dynamic-field-value.dto';
import { UpdateCustomerDynamicFieldValueDto } from '../dto/update-customer-dynamic-field-value.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('customer-dynamic-field-values')
@ApiBearerAuth('JWT-auth')
@Controller('customer-dynamic-field-values')
export class CustomerDynamicFieldValueController {
  constructor(
    private readonly customerDynamicFieldValueService: CustomerDynamicFieldValueService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic field value' })
  @ApiResponse({
    status: 201,
    description: 'Dynamic field value created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(
    @Body()
    createCustomerDynamicFieldValueDto: CreateCustomerDynamicFieldValueDto,
  ) {
    return this.customerDynamicFieldValueService.create(
      createCustomerDynamicFieldValueDto,
    );
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple dynamic field values' })
  @ApiResponse({
    status: 201,
    description: 'Dynamic field values created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createMany(
    @Body()
    createCustomerDynamicFieldValueDtos: CreateCustomerDynamicFieldValueDto[],
  ) {
    return this.customerDynamicFieldValueService.createMany(
      createCustomerDynamicFieldValueDtos,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all dynamic field values' })
  @ApiResponse({ status: 200, description: 'List of dynamic field values' })
  findAll() {
    return this.customerDynamicFieldValueService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific dynamic field value by ID' })
  @ApiResponse({ status: 200, description: 'Dynamic field value found' })
  @ApiResponse({ status: 404, description: 'Dynamic field value not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerDynamicFieldValueService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dynamic field value' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic field value updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Dynamic field value not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateCustomerDynamicFieldValueDto: UpdateCustomerDynamicFieldValueDto,
  ) {
    return this.customerDynamicFieldValueService.update(
      id,
      updateCustomerDynamicFieldValueDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dynamic field value' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic field value deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Dynamic field value not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerDynamicFieldValueService.remove(id);
  }

  @Delete('customer/:customerId')
  @ApiOperation({ summary: 'Delete all dynamic field values for a customer' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic field values deleted successfully',
  })
  deleteByCustomerId(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.customerDynamicFieldValueService.deleteByCustomerId(customerId);
  }
}

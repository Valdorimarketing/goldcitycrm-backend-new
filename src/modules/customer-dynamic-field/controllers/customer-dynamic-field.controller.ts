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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('customer-dynamic-fields')
@ApiBearerAuth('JWT-auth')
@Controller('customer-dynamic-fields')
export class CustomerDynamicFieldController {
  constructor(
    private readonly customerDynamicFieldService: CustomerDynamicFieldService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic field for customers' })
  @ApiResponse({
    status: 201,
    description: 'Dynamic field created successfully',
    type: CustomerDynamicField,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createCustomerDynamicFieldDto: CreateCustomerDynamicFieldDto) {
    return this.customerDynamicFieldService.create(
      createCustomerDynamicFieldDto,
      CustomerDynamicField,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all customer dynamic fields' })
  @ApiResponse({
    status: 200,
    description: 'List of dynamic fields',
    type: [CustomerDynamicField],
  })
  findAll() {
    return this.customerDynamicFieldService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific dynamic field by ID' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic field found',
    type: CustomerDynamicField,
  })
  @ApiResponse({ status: 404, description: 'Dynamic field not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerDynamicFieldService.findOneById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dynamic field' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic field updated successfully',
    type: CustomerDynamicField,
  })
  @ApiResponse({ status: 404, description: 'Dynamic field not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDynamicFieldDto: UpdateCustomerDynamicFieldDto,
  ) {
    return this.customerDynamicFieldService.update(
      updateCustomerDynamicFieldDto,
      id,
      CustomerDynamicField,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dynamic field' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic field deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Dynamic field not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerDynamicFieldService.remove(id);
  }
}

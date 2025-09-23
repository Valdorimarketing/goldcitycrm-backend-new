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
import { Customer2DoctorService } from '../services/customer2doctor.service';
import { CreateCustomer2DoctorDto } from '../dto/create-customer2doctor.dto';
import { UpdateCustomer2DoctorDto } from '../dto/update-customer2doctor.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('customer2doctor')
@UseGuards(JwtAuthGuard)
export class Customer2DoctorController {
  constructor(
    private readonly customer2DoctorService: Customer2DoctorService,
  ) {}

  @Post()
  create(@Body() createDto: CreateCustomer2DoctorDto) {
    return this.customer2DoctorService.createCustomer2Doctor(createDto);
  }

  @Get()
  async findAll(@Query() query: BaseQueryFilterDto) {
    return this.customer2DoctorService.findByFilters(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customer2DoctorService.findById(+id);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.customer2DoctorService.findByCustomerId(+customerId);
  }

  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.customer2DoctorService.findByDoctorId(+doctorId);
  }

  @Get('relationship/:customerId/:doctorId')
  findRelationship(
    @Param('customerId') customerId: string,
    @Param('doctorId') doctorId: string,
  ) {
    return this.customer2DoctorService.findByCustomerAndDoctor(
      +customerId,
      +doctorId,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCustomer2DoctorDto) {
    return this.customer2DoctorService.update(
      updateDto,
      +id,
      CreateCustomer2DoctorDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customer2DoctorService.remove(+id);
  }

  @Delete('relationship/:customerId/:doctorId')
  removeRelationship(
    @Param('customerId') customerId: string,
    @Param('doctorId') doctorId: string,
  ) {
    return this.customer2DoctorService.removeByCustomerAndDoctor(
      +customerId,
      +doctorId,
    );
  }
}

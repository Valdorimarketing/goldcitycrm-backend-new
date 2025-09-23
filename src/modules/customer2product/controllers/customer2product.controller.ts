import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Customer2ProductService } from '../services/customer2product.service';
import { CreateCustomer2ProductDto } from '../dto/create-customer2product.dto';
import { UpdateCustomer2ProductDto } from '../dto/update-customer2product.dto';
import { BulkCreateCustomer2ProductDto } from '../dto/bulk-create-customer2product.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('customer2product')
@UseGuards(JwtAuthGuard)
export class Customer2ProductController {
  constructor(
    private readonly customer2ProductService: Customer2ProductService,
  ) {}

  @Post()
  create(@Body() createDto: CreateCustomer2ProductDto) {
    return this.customer2ProductService.createCustomer2Product(createDto);
  }

  @Post('bulk')
  bulkCreate(@Body() bulkCreateDto: BulkCreateCustomer2ProductDto) {
    return this.customer2ProductService.bulkCreate(bulkCreateDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryFilterDto) {
    return this.customer2ProductService.findByFilters(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customer2ProductService.findById(+id);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.customer2ProductService.findByCustomer(+customerId);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.customer2ProductService.findByProduct(+productId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomer2ProductDto,
  ) {
    return this.customer2ProductService.updateCustomer2Product(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customer2ProductService.remove(+id);
  }
}

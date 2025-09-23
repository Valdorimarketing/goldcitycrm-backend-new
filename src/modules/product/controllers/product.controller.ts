import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<Product[]> {
    if (name) {
      return this.productService.getProductsByName(name);
    }

    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      return this.productService.getProductsByPriceRange(min, max);
    }

    return this.productService.getAllProducts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.getProductById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.updateProduct(+id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> {
    return this.productService.deleteProduct(+id);
  }
}

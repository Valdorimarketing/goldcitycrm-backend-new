import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Product } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../dto/create-product.dto';

@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(private readonly productRepository: ProductRepository) {
    super(productRepository, Product);
  }

  async createProduct(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.create(createProductDto, ProductResponseDto);
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    return this.update(updateProductDto, id, ProductResponseDto);
  }

  async getProductById(id: number): Promise<Product> {
    return this.findOneById(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.findAll();
  }

  async getProductsByName(name: string): Promise<Product[]> {
    return this.productRepository.findByName(name);
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.productRepository.findByPriceRange(minPrice, maxPrice);
  }

  async deleteProduct(id: number): Promise<Product> {
    return this.remove(id);
  }
} 
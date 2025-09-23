import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer2Product } from './entities/customer2product.entity';
import { Customer2ProductService } from './services/customer2product.service';
import { Customer2ProductController } from './controllers/customer2product.controller';
import { Customer2ProductRepository } from './repositories/customer2product.repository';
import { CustomerModule } from '../customer/customer.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer2Product]),
    CustomerModule,
    ProductModule,
  ],
  controllers: [Customer2ProductController],
  providers: [Customer2ProductService, Customer2ProductRepository],
  exports: [Customer2ProductService],
})
export class Customer2ProductModule {}

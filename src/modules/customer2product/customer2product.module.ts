import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer2Product } from './entities/customer2product.entity';
import { Customer2ProductService } from './services/customer2product.service';
import { Customer2ProductController } from './controllers/customer2product.controller';
import { Customer2ProductRepository } from './repositories/customer2product.repository';
import { CustomerModule } from '../customer/customer.module';
import { ProductModule } from '../product/product.module';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { Sales } from '../sales/entities/sales.entity';
import { SalesProduct } from '../sales-product/entities/sales-product.entity';
import { SalesGateway } from '../sales/sales.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer2Product, Sales, SalesProduct]),
    CustomerModule,
    ProductModule,
    CustomerHistoryModule,
  ],
  controllers: [Customer2ProductController],
  providers: [Customer2ProductService, Customer2ProductRepository, SalesGateway],
  exports: [Customer2ProductService],
})
export class Customer2ProductModule {}

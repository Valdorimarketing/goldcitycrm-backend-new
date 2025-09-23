import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerHistoryController } from './controllers/customer-history.controller';
import { CustomerHistory } from './entities/customer-history.entity';
import { CustomerHistoryRepository } from './repositories/customer-history.repository';
import { CustomerHistoryService } from './services/customer-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerHistory])],
  controllers: [CustomerHistoryController],
  providers: [CustomerHistoryService, CustomerHistoryRepository],
  exports: [CustomerHistoryService, CustomerHistoryRepository],
})
export class CustomerHistoryModule {}

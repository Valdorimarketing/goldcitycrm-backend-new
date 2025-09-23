import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerFileController } from './controllers/customer-file.controller';
import { CustomerFile } from './entities/customer-file.entity';
import { CustomerFileRepository } from './repositories/customer-file.repository';
import { CustomerFileService } from './services/customer-file.service';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerFile]), CustomerHistoryModule],
  controllers: [CustomerFileController],
  providers: [CustomerFileService, CustomerFileRepository],
  exports: [CustomerFileService, CustomerFileRepository],
})
export class CustomerFileModule {}

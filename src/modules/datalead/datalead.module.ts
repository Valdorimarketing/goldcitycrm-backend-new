import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataleadController } from './controllers/datalead.controller';
import { DataleadService } from './services/datalead.service';
import { ApiKeyService } from './services/api-key.service';
import { ApiKey } from './entities/api-key.entity';
import { Customer } from '../customer/entities/customer.entity';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, Customer])],
  controllers: [DataleadController],
  providers: [DataleadService, ApiKeyService, ApiKeyGuard],
  exports: [DataleadService],
})
export class DataleadModule {}

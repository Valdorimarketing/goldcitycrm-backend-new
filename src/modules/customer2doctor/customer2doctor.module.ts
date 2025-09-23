import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer2Doctor } from './entities/customer2doctor.entity';
import { Customer2DoctorService } from './services/customer2doctor.service';
import { Customer2DoctorController } from './controllers/customer2doctor.controller';
import { Customer2DoctorRepository } from './repositories/customer2doctor.repository';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer2Doctor]), CustomerModule],
  controllers: [Customer2DoctorController],
  providers: [Customer2DoctorService, Customer2DoctorRepository],
  exports: [Customer2DoctorService],
})
export class Customer2DoctorModule {}

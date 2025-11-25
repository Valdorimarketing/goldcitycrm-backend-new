import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer2Doctor } from './entities/customer2doctor.entity';
import { Customer2DoctorService } from './services/customer2doctor.service';
import { Customer2DoctorController } from './controllers/customer2doctor.controller';
import { Customer2DoctorRepository } from './repositories/customer2doctor.repository';
import { CustomerModule } from '../customer/customer.module';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { DoctorModule } from '../doctor/doctor.module';
import { CustomerEngagementModule } from '../customer-engagement/customer-engagement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer2Doctor]),
    forwardRef(() => CustomerModule),
    forwardRef(() => CustomerEngagementModule),
    CustomerHistoryModule,
    DoctorModule,
  ],
  controllers: [Customer2DoctorController],
  providers: [Customer2DoctorService, Customer2DoctorRepository],
  exports: [Customer2DoctorService, Customer2DoctorRepository],
})
export class Customer2DoctorModule {}
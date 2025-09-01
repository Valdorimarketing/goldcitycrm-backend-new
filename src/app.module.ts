import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { CustomerModule } from './modules/customer/customer.module';
import { RoleModule } from './modules/role/role.module';
import { SalesModule } from './modules/sales/sales.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductModule } from './modules/product/product.module';
import { CountryModule } from './modules/country/country.module';
import { StateModule } from './modules/state/state.module';
import { CityModule } from './modules/city/city.module';
import { CustomerDynamicFieldModule } from './modules/customer-dynamic-field/customer-dynamic-field.module';
import { CustomerDynamicFieldValueModule } from './modules/customer-dynamic-field-value/customer-dynamic-field-value.module';
import { FraudAlertModule } from './modules/fraud-alert/fraud-alert.module';
import { StatusModule } from './modules/status/status.module';
import { ActionListModule } from './modules/action-list/action-list.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { CustomerNoteModule } from './modules/customer-note/customer-note.module';
import { CustomerHistoryModule } from './modules/customer-history/customer-history.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { BranchModule } from './modules/branch/branch.module';
import { DoctorModule } from './modules/doctor/doctor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'valdori_crm',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UserModule,
    CustomerModule,
    RoleModule,
    SalesModule,
    ProductModule,
    CountryModule,
    StateModule,
    CityModule,
    CustomerDynamicFieldModule,
    CustomerDynamicFieldValueModule,
    FraudAlertModule,
    StatusModule,
    ActionListModule,
    MeetingModule,
    CustomerNoteModule,
    CustomerHistoryModule,
    HospitalModule,
    BranchModule,
    DoctorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

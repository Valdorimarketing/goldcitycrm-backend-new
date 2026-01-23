import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UpdateLastActiveInterceptor } from './core/interceptors/update-last-active.interceptor';

// Modüller
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { UserGroupModule } from './modules/user-group/user-group.module';
import { CustomerModule } from './modules/customer/customer.module';
import { RoleModule } from './modules/role/role.module';
import { SalesModule } from './modules/sales/sales.module';
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
import { MeetingStatusModule } from './modules/meeting-status/meeting-status.module';
import { CustomerNoteModule } from './modules/customer-note/customer-note.module';
import { CustomerHistoryModule } from './modules/customer-history/customer-history.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { BranchModule } from './modules/branch/branch.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { SourceModule } from './modules/source/source.module';
import { CustomerFileModule } from './modules/customer-file/customer-file.module';
import { PaymentModule } from './modules/payment/payment.module';
import { Customer2DoctorModule } from './modules/customer2doctor/customer2doctor.module';
import { Customer2ProductModule } from './modules/customer2product/customer2product.module'; 
import { CurrencyModule } from './modules/currencies/currency.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DataleadModule } from './modules/datalead/datalead.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { OperationsModule } from './modules/operations/operations.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TeamModule } from './modules/team/team.module'; 
import { CustomerEngagementModule } from './modules/customer-engagement/customer-engagement.module';
import { WhatConvertsModule } from './modules/whatconverts/whatconverts.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SalesSheetSyncModule } from './modules/sales-sheet-sync/sync.module';
import { HealthController } from './modules/system/health.controller';
import { ProformaModule } from './modules/proformas/proforma.module';
import { LanguageModule } from './modules/language/language.module';
import { GmailModule } from './modules/gmail/gmail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    ThrottlerModule.forRoot([
      {
        ttl: 60, // saniye cinsinden süre (60 saniye = 1 dakika)
        limit: 2000, // dakika başına 100 istek
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'valdori_crm',
      entities: [__dirname + '/**/*.entity{.js}'],
      autoLoadEntities: true, 
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UserModule,
    UserGroupModule,
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
    MeetingStatusModule,
    CustomerNoteModule,
    CustomerHistoryModule,
    HospitalModule,
    BranchModule,
    DoctorModule,
    SourceModule,
    CustomerFileModule,
    PaymentModule,
    Customer2DoctorModule,
    Customer2ProductModule,
    CurrencyModule,
    NotificationModule,
    DataleadModule,
    OperationsModule,
    ProfileModule,
    TeamModule,
    CustomerEngagementModule,
    EventEmitterModule.forRoot(),
    WhatConvertsModule,
    SalesSheetSyncModule,
    ProformaModule,
    LanguageModule,
    GmailModule
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UpdateLastActiveInterceptor,
    },
  ],
})
export class AppModule {}

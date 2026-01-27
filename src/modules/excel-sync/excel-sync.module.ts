import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelSyncController } from './excel-sync.controller';
import { ExcelSyncService } from './excel-sync.service';
import { Customer } from '../customer/entities/customer.entity';
import { CustomerNote } from '../customer-note/entities/customer-note.entity';
import { CustomerHistory } from '../customer-history/entities/customer-history.entity';
import { Source } from '../source/entities/source.entity';
import { Status } from '../status/entities/status.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerNote, CustomerHistory, Source, Status, User]),
  ],
  controllers: [ExcelSyncController],
  providers: [ExcelSyncService],
  exports: [ExcelSyncService],
})
export class ExcelSyncModule {}

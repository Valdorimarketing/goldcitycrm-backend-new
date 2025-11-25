import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerNoteController } from './controllers/customer-note.controller';
import { CustomerNote } from './entities/customer-note.entity';
import { CustomerNoteRepository } from './repositories/customer-note.repository';
import { CustomerNoteService } from './services/customer-note.service';
import { User } from '../user/entities/user.entity';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerNote, User]),
    CustomerHistoryModule
  ],
  controllers: [CustomerNoteController],
  providers: [
    CustomerNoteService,
    CustomerNoteRepository
  ],
  exports: [
    CustomerNoteService,
    CustomerNoteRepository
  ],
})
export class CustomerNoteModule {}

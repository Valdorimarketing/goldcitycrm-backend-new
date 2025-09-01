import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionList } from './entities/action-list.entity';
import { ActionListRepository } from './repositories/action-list.repository';
import { ActionListService } from './services/action-list.service';
import { ActionListController } from './controllers/action-list.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActionList])],
  controllers: [ActionListController],
  providers: [ActionListService, ActionListRepository],
  exports: [ActionListService],
})
export class ActionListModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateController } from './controllers/state.controller';
import { State } from './entities/state.entity';
import { StateRepository } from './repositories/state.repository';
import { StateService } from './services/state.service';

@Module({
  imports: [TypeOrmModule.forFeature([State])],
  controllers: [StateController],
  providers: [StateService, StateRepository],
  exports: [StateService, StateRepository],
})
export class StateModule {} 
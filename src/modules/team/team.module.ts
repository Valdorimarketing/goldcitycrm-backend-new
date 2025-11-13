import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { Team } from './entities/team.entity';
import { TeamController } from './controllers/team.controller';
import { TeamService } from './services/team.service';
import { TeamRepository } from './repositories/team.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Team])],
  controllers: [TeamController],
  providers: [TeamService, TeamRepository],
  exports: [TeamService],
})
export class TeamModule {}

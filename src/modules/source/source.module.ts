import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Source } from './entities/source.entity';
import { SourceController } from './controllers/source.controller';
import { SourceService } from './services/source.service';
import { SourceRepository } from './repositories/source.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Source])],
  controllers: [SourceController],
  providers: [SourceService, SourceRepository],
  exports: [SourceService],
})
export class SourceModule {}

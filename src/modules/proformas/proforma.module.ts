import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProformaService } from './services/proforma.service';
import { Proforma } from './entities/proforma.entity';
import { ProformaController } from './controller/proforma.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proforma]),
  ],
  controllers: [ProformaController],
  providers: [ProformaService],
  exports: [ProformaService],
})
export class ProformaModule {}
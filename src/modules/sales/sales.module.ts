import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './controllers/sales.controller';
import { SalesService } from './services/sales.service';
import { Sales } from './entities/sales.entity';
import { SalesRepository } from './repositories/sales.repository';
import { Meeting } from '../meeting/entities/meeting.entity';
import { Product } from '../product/entities/product.entity';
import { SalesProduct } from '../sales-product/entities/sales-product.entity';
import { CustomerNote } from '../customer-note/entities/customer-note.entity';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { UserModule } from '../user/user.module';
import { Team } from '../team/entities/team.entity'; // Team entity ekle

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sales,
      Meeting,
      Product,
      SalesProduct,
      CustomerNote,
      Team, // Team entity'yi ekle
    ]),
    CustomerHistoryModule,
    UserModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService, SalesRepository],
})
export class SalesModule {}
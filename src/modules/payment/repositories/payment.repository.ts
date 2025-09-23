import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentRepository extends BaseRepositoryAbstract<Payment> {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    super(paymentRepository);
  }
}

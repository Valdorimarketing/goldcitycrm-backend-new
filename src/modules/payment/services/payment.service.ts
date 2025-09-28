import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Payment } from '../entities/payment.entity';
import { PaymentRepository } from '../repositories/payment.repository';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
} from '../dto/create-payment.dto';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';

@Injectable()
export class PaymentService extends BaseService<Payment> {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly customerHistoryService: CustomerHistoryService,
  ) {
    super(paymentRepository, Payment);
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    userId?: number,
  ): Promise<PaymentResponseDto> {
    const payment = await this.create(createPaymentDto, PaymentResponseDto);

    // Log to customer history if customer is provided
    if (createPaymentDto.customerId) {
      await this.customerHistoryService.logCustomerAction(
        createPaymentDto.customerId,
        CustomerHistoryAction.PAYMENT_CREATED,
        `Payment recorded: Amount ${createPaymentDto.amount} - ${createPaymentDto.description || ''}`,
        createPaymentDto,
        null,
        userId,
        payment.id,
      );
    }

    return payment;
  }

  async updatePayment(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.update(updatePaymentDto, id, PaymentResponseDto);
  }

  async getPaymentById(id: number): Promise<Payment> {
    return this.findOneById(id);
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.findAll();
  }

  async getPaymentsByCustomer(customerId: number): Promise<Payment[]> {
    return this.paymentRepository.findAll({
      where: { customerId: customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async deletePayment(id: number): Promise<Payment> {
    return this.remove(id);
  }
}

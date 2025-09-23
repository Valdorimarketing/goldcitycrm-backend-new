import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
} from '../dto/create-payment.dto';
import { Payment } from '../entities/payment.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUserId() userId: number,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.createPayment(createPaymentDto, userId);
  }

  @Get()
  async findAll(@Query('sales') sales?: string): Promise<Payment[]> {
    if (sales) {
      return this.paymentService.getPaymentsBySales(+sales);
    }
    return this.paymentService.getAllPayments();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.getPaymentById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.updatePayment(+id, updatePaymentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.deletePayment(+id);
  }
}

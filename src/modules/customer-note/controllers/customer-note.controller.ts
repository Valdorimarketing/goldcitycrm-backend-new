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
import { CustomerNoteService } from '../services/customer-note.service';
import {
  CreateCustomerNoteDto,
  UpdateCustomerNoteDto,
  CustomerNoteResponseDto,
} from '../dto/create-customer-note.dto';
import { CustomerNote } from '../entities/customer-note.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';

@Controller('customer-notes')
@UseGuards(JwtAuthGuard)
export class CustomerNoteController {
  constructor(private readonly customerNoteService: CustomerNoteService) { }

  @Post()
  async create(
    @Body() createCustomerNoteDto: CreateCustomerNoteDto,
    @CurrentUserId() userId: number,
  ): Promise<CustomerNoteResponseDto> {
    return this.customerNoteService.createCustomerNote(
      createCustomerNoteDto,
      userId,
    );
  }

  @Get()
  async findAll(
    @Query('customer') customer?: string,
    @Query('user') user?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isReminding') isReminding?: string,
    @Query('noteType') noteType?: string,
    @Query('today') today?: string,
  ): Promise<CustomerNote[]> {
    // Bugünün kayıtları isteniyorsa
    if (today === 'true') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      return this.customerNoteService.getCustomerNotesByDateRange({
        customer: customer ? +customer : undefined,
        user: user ? +user : undefined,
        startDate: todayStart,
        endDate: todayEnd,
        isReminding:
          isReminding === 'true'
            ? true
            : isReminding === 'false'
              ? false
              : undefined,
        noteType,
      });
    }

    // Tarih filtrelemesi varsa
    if (startDate || endDate) {
      // Eğer sadece tarih geliyorsa (2025-08-22 gibi), saat ekle
      let startDateTime = undefined;
      let endDateTime = undefined;

      if (startDate) {
        startDateTime = new Date(startDate);
        // Eğer sadece tarih ise, günün başına ayarla
        if (startDate.length === 10) {
          startDateTime.setHours(0, 0, 0, 0);
        }
      }

      if (endDate) {
        endDateTime = new Date(endDate);
        // Eğer sadece tarih ise, günün sonuna ayarla
        if (endDate.length === 10) {
          endDateTime.setHours(23, 59, 59, 999);
        }
      }

      return this.customerNoteService.getCustomerNotesByDateRange({
        customer: customer ? +customer : undefined,
        user: user ? +user : undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        isReminding:
          isReminding === 'true'
            ? true
            : isReminding === 'false'
              ? false
              : undefined,
        noteType,
      });
    }

    if (customer) {
      return this.customerNoteService.getCustomerNotesByCustomer(+customer);
    }
    if (user) {
      return this.customerNoteService.getCustomerNotesByUser(+user);
    }
    return this.customerNoteService.getAllCustomerNotes();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerNote> {
    return this.customerNoteService.getCustomerNoteById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerNoteDto: UpdateCustomerNoteDto,
    @CurrentUserId() userId: number,
  ): Promise<CustomerNoteResponseDto> {
    const dtoWithUser = {
      ...updateCustomerNoteDto,
      user: userId,
    };
    return this.customerNoteService.updateCustomerNote(+id, dtoWithUser);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUserId() userId?: number,
  ): Promise<CustomerNote> {
    return this.customerNoteService.deleteCustomerNote(+id, userId);
  }



}

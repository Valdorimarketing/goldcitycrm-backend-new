import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { FraudAlertService } from '../services/fraud-alert.service';
import { CreateFraudAlertDto } from '../dto/create-fraud-alert.dto';
import { UpdateFraudAlertDto } from '../dto/update-fraud-alert.dto';
import { FraudAlertResponseDto } from '../dto/fraud-alert-response.dto';
import { FraudAlert } from '../entities/fraud-alert.entity';

@Controller('fraud-alerts')
export class FraudAlertController {
  constructor(private readonly fraudAlertService: FraudAlertService) {}

  @Post()
  async create(@Body() createFraudAlertDto: CreateFraudAlertDto): Promise<FraudAlertResponseDto> {
    return this.fraudAlertService.createFraudAlert(createFraudAlertDto);
  }

  @Get()
  async findAll(
    @Query('user') user?: string,
    @Query('unread') unread?: string,
    @Query('unchecked') unchecked?: string,
  ): Promise<FraudAlert[]> {
    if (unread === 'true') {
      return this.fraudAlertService.getUnreadFraudAlerts(user ? +user : undefined);
    }
    if (unchecked === 'true') {
      return this.fraudAlertService.getUncheckedFraudAlerts(user ? +user : undefined);
    }
    if (user) {
      return this.fraudAlertService.getFraudAlertsByUser(+user);
    }
    return this.fraudAlertService.getAllFraudAlerts();
  }

  @Get('count/unread')
  async getUnreadCount(@Query('user') user?: string): Promise<{ count: number }> {
    const count = await this.fraudAlertService.getUnreadCount(user ? +user : undefined);
    return { count };
  }

  @Get('count/unchecked')
  async getUncheckedCount(@Query('user') user?: string): Promise<{ count: number }> {
    const count = await this.fraudAlertService.getUncheckedCount(user ? +user : undefined);
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FraudAlert> {
    return this.fraudAlertService.getFraudAlertById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFraudAlertDto: UpdateFraudAlertDto,
  ): Promise<FraudAlertResponseDto> {
    return this.fraudAlertService.updateFraudAlert(+id, updateFraudAlertDto);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string): Promise<FraudAlert> {
    return this.fraudAlertService.markAsRead(+id);
  }

  @Put(':id/check')
  async markAsChecked(@Param('id') id: string): Promise<FraudAlert> {
    return this.fraudAlertService.markAsChecked(+id);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Query('user') user?: string): Promise<{ message: string }> {
    await this.fraudAlertService.markAllAsRead(user ? +user : undefined);
    return { message: 'All fraud alerts marked as read' };
  }

  @Put('mark-all-checked')
  async markAllAsChecked(@Query('user') user?: string): Promise<{ message: string }> {
    await this.fraudAlertService.markAllAsChecked(user ? +user : undefined);
    return { message: 'All fraud alerts marked as checked' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<FraudAlert> {
    return this.fraudAlertService.deleteFraudAlert(+id);
  }
}
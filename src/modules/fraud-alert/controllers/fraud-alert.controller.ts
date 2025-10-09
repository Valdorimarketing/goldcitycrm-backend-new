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
  UseGuards,
} from '@nestjs/common';
import { FraudAlertService } from '../services/fraud-alert.service';
import { CreateFraudAlertDto } from '../dto/create-fraud-alert.dto';
import { UpdateFraudAlertDto } from '../dto/update-fraud-alert.dto';
import { FraudAlertResponseDto } from '../dto/fraud-alert-response.dto';
import { FraudAlertQueryFilterDto } from '../dto/fraud-alert-query-filter.dto';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../core/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('fraud-alerts')
@ApiBearerAuth('JWT-auth')
@Controller('fraud-alerts')
@UseGuards(JwtAuthGuard)
export class FraudAlertController {
  constructor(private readonly fraudAlertService: FraudAlertService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fraud alert' })
  @ApiResponse({
    status: 201,
    description: 'Fraud alert created successfully',
    type: FraudAlertResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createFraudAlertDto: CreateFraudAlertDto,
  ): Promise<FraudAlertResponseDto> {
    return this.fraudAlertService.createFraudAlert(createFraudAlertDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all fraud alerts with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Fraud alerts retrieved successfully',
  })
  async findAll(
    @Query() query: FraudAlertQueryFilterDto,
    @Query('user') user?: string,
    @Query('unread') unread?: string,
    @Query('unchecked') unchecked?: string,
    @Query('include') include?: string,
  ) {
    // Backward compatibility: Convert old query params to new DTO format
    const filters: FraudAlertQueryFilterDto = { ...query };

    // Map old 'user' param to userId
    if (user && !filters.userId) {
      filters.userId = +user;
    }

    // Map old 'unread=true' to isRead=false
    if (unread === 'true' && filters.isRead === undefined) {
      filters.isRead = false;
    }

    // Map old 'unchecked=true' to isChecked=false
    if (unchecked === 'true' && filters.isChecked === undefined) {
      filters.isChecked = false;
    }

    // If using old API without pagination, return array directly
    if (
      (unread || unchecked || user || include) &&
      !query.page &&
      !query.limit
    ) {
      if (unread === 'true') {
        return this.fraudAlertService.getUnreadFraudAlerts(
          user ? +user : undefined,
        );
      }
      if (unchecked === 'true') {
        return this.fraudAlertService.getUncheckedFraudAlerts(
          user ? +user : undefined,
        );
      }
      if (user) {
        return this.fraudAlertService.getFraudAlertsByUser(+user);
      }
      // Default case with include=user (old API)
      return this.fraudAlertService.getAllFraudAlerts();
    }

    // New pagination API
    const queryBuilder =
      await this.fraudAlertService.findByFiltersBaseQuery(filters);
    return this.fraudAlertService.paginate(queryBuilder, filters, FraudAlert);
  }

  @Public()
  @Get('count/unread')
  @ApiOperation({ summary: 'Get unread fraud alerts count' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  async getUnreadCount(
    @Query('user') user?: string,
  ): Promise<{ count: number }> {
    const count = await this.fraudAlertService.getUnreadCount(
      user ? +user : undefined,
    );
    return { count };
  }

  @Public()
  @Get('count/unchecked')
  @ApiOperation({ summary: 'Get unchecked fraud alerts count' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  async getUncheckedCount(
    @Query('user') user?: string,
  ): Promise<{ count: number }> {
    const count = await this.fraudAlertService.getUncheckedCount(
      user ? +user : undefined,
    );
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
  async markAllAsRead(
    @Query('user') user?: string,
  ): Promise<{ message: string }> {
    await this.fraudAlertService.markAllAsRead(user ? +user : undefined);
    return { message: 'All fraud alerts marked as read' };
  }

  @Put('mark-all-checked')
  async markAllAsChecked(
    @Query('user') user?: string,
  ): Promise<{ message: string }> {
    await this.fraudAlertService.markAllAsChecked(user ? +user : undefined);
    return { message: 'All fraud alerts marked as checked' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<FraudAlert> {
    return this.fraudAlertService.deleteFraudAlert(+id);
  }
}

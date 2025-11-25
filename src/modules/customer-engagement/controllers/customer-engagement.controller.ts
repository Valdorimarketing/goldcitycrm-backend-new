import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CustomerEngagementService } from '../services/customer-engagement.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('customer-engagements')
@UseGuards(JwtAuthGuard) // Auth guard ekle
export class CustomerEngagementController {
  constructor(
    private readonly customerEngagementService: CustomerEngagementService,
  ) {}

  // ✅ Dashboard KPI
  @Get('dashboard/kpi')
  async getDashboardKpi() {
    return this.customerEngagementService.getDashboardKpi();
  }

  // ✅ User Performance List
  @Get('dashboard/users')
  async getUserPerformanceList(
    @Query('period') period?: 'week' | 'month',
  ) {
    return this.customerEngagementService.getUserPerformanceList(period || 'week');
  }

  // ✅ User History
  @Get('users/:userId/history')
  async getUserHistory(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
  ) {
    return this.customerEngagementService.getUserHistory(userId, limit || 20);
  }

  // ✅ Engagement Timeline
  @Get(':engagementId/timeline')
  async getEngagementTimeline(
    @Param('engagementId') engagementId: number,
  ) {
    return this.customerEngagementService.getEngagementTimeline(engagementId);
  }
}
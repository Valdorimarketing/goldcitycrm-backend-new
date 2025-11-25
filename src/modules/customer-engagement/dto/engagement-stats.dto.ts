export class EngagementStatsDto {
  totalCustomers: number;
  avgFirstTouchMinutes: number;
  avgClosingMinutes: number;
  activeCount: number;
  conversionRate: number;
}

export class UserPerformanceDto {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  activeEngagements: ActiveEngagementDto[];
  stats: EngagementStatsDto;
}

export class ActiveEngagementDto {
  customerId: number;
  customerName: string;
  status: string;
  timer: string;
  phase: string;
  assignedAt: Date;
  lastTouchAt: Date;
}

export class DashboardKpiDto {
  activeProcesses: number;
  salesActive: number;
  doctorActive: number;
  avgFirstTouchMinutes: number;
  avgFirstCallMinutes: number;
  closedThisWeek: number;
}

export class EngagementHistoryDto {
    id: number;
    customerId: number;
    customerName: string;
    userId: number;
    userName: string;
    duration: string;
    durationInSeconds: number;
    firstTouchMinutes: number;
    firstCallMinutes: number;
    startDate: Date;
    endDate: Date;
    status: string;
    result: string;
}

export class EngagementTimelineEventDto {
  id: number;
  time: string;
  type: string;
  title: string;
  description: string;
  duration?: string;
  note?: string;
  icon: string;
  color: string;
  speed?: 'fast' | 'normal' | 'slow';
}
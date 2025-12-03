// src/modules/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  
  /**
   * Health check endpoint - Auth gerektirmez
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ping endpoint - Auth gerektirmez
   */
  @Get('ping')
  @ApiOperation({ summary: 'Ping endpoint' })
  ping() {
    return 'pong';
  }
}
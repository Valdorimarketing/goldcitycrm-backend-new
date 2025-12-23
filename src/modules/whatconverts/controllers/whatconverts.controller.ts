import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { WhatConvertsService } from '../services/whatconverts.service';
import {
  WebhookResponseDto,
  LeadMappingConfigDto,
  WhatConvertsLogQueryDto,
} from '../dto/whatconverts-webhook.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('WhatConverts')
@Controller('whatconverts')
export class WhatConvertsController {
  private readonly logger = new Logger(WhatConvertsController.name);
  private readonly webhookSecret: string;
  private readonly enableSecretValidation: boolean;

  constructor(
    private readonly whatConvertsService: WhatConvertsService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>('WHATCONVERTS_WEBHOOK_SECRET');
    this.enableSecretValidation = this.configService.get<string>('WHATCONVERTS_ENABLE_SECRET_VALIDATION') === 'true';
    
    this.logger.log(`Webhook secret validation: ${this.enableSecretValidation ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * WEBHOOK ENDPOINT - WhatConverts'ten gelen lead'leri alır
   * ═══════════════════════════════════════════════════════════════
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'WhatConverts Webhook Endpoint',
    description: 'Receives lead data from WhatConverts when a new lead is created',
  })
  @ApiHeader({
    name: 'X-Webhook-Secret',
    description: 'Webhook authentication secret',
    required: false,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Invalid webhook secret' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-webhook-secret') headerSecret: string,
    @Headers('x-whatconverts-signature') signature: string,
    @Query('secret') querySecret: string, // ✅ Query param'dan da oku
    @Ip() ip: string,
  ): Promise<WebhookResponseDto> {
    this.logger.log(`📥 Webhook received from IP: ${ip}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload).substring(0, 500)}...`);

    // ✅ Webhook secret doğrulama (sadece enable ise)
    if (this.enableSecretValidation && this.webhookSecret) {
      const receivedSecret = headerSecret || querySecret;
      
      if (!receivedSecret) {
        this.logger.warn(`⚠️ No webhook secret provided from IP: ${ip}`);
        throw new BadRequestException('Webhook secret required');
      }

      if (receivedSecret !== this.webhookSecret) {
        this.logger.warn(`⚠️ Invalid webhook secret from IP: ${ip}`);
        throw new BadRequestException('Invalid webhook secret');
      }

      this.logger.debug('✅ Webhook secret validated successfully');
    } else {
      this.logger.debug('ℹ️ Webhook secret validation disabled');
    }

    // Boş payload kontrolü
    if (!payload || Object.keys(payload).length === 0) {
      this.logger.error('❌ Empty webhook payload received');
      throw new BadRequestException('Empty payload');
    }

    return this.whatConvertsService.processWebhook(payload, ip);
  }

  /**
   * Test endpoint - Webhook'u manuel test etmek için
   */
  @Post('webhook/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Test webhook with sample data' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testWebhook(@Body() payload: any): Promise<WebhookResponseDto> {
    this.logger.log('🧪 Test webhook triggered');
    return this.whatConvertsService.processWebhook(payload, 'test');
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * ADMIN ENDPOINTS - Yönetim paneli için
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Webhook loglarını listele
   */
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get webhook logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async getLogs(@Query() query: WhatConvertsLogQueryDto) {
    return this.whatConvertsService.getLogs(query);
  }

  /**
   * İstatistikleri getir
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getStats(@Query('days') days?: number) {
    return this.whatConvertsService.getStats(days || 7);
  }

  /**
   * Mapping config'i getir
   */
  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get lead mapping configuration' })
  async getConfig() {
    return this.whatConvertsService.getMappingConfig();
  }

  /**
   * Mapping config'i güncelle
   */
  @Patch('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update lead mapping configuration' })
  async updateConfig(@Body() config: LeadMappingConfigDto) {
    return this.whatConvertsService.updateMappingConfig(config);
  }

  /**
   * Başarısız lead'i yeniden işle
   */
  @Post('logs/:id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retry failed webhook' })
  async retryWebhook(@Param('id') id: number): Promise<WebhookResponseDto> {
    return this.whatConvertsService.retryLead(id);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check for webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'whatconverts-webhook',
      timestamp: new Date().toISOString(),
      secretValidation: this.enableSecretValidation ? 'enabled' : 'disabled',
    };
  }
}
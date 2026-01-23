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
import { GmailService } from '../services/gmail.service';
import {
  GmailWebhookResponseDto,
  GmailMappingConfigDto,
  GmailLogQueryDto,
  PubSubMessageDto,
  GmailWatchSetupDto,
} from '../dto/gmail-webhook.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Gmail')
@Controller('gmail')
export class GmailController {
  private readonly logger = new Logger(GmailController.name);
  private readonly webhookSecret: string;
  private readonly enableSecretValidation: boolean;

  constructor(
    private readonly gmailService: GmailService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>('GMAIL_WEBHOOK_SECRET');
    this.enableSecretValidation = this.configService.get<string>('GMAIL_ENABLE_SECRET_VALIDATION') === 'true';
    
    this.logger.log(`Gmail webhook secret validation: ${this.enableSecretValidation ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * WEBHOOK ENDPOINT - Google Pub/Sub'dan gelen bildirimleri alır
   * ═══════════════════════════════════════════════════════════════
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Gmail Webhook Endpoint',
    description: 'Receives notifications from Google Pub/Sub when new Gmail messages arrive',
  })
  @ApiHeader({
    name: 'X-Webhook-Secret',
    description: 'Webhook authentication secret',
    required: false,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    type: GmailWebhookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Invalid webhook secret' })
  async handleWebhook(
    @Body() payload: PubSubMessageDto,
    @Headers('x-webhook-secret') headerSecret: string,
    @Query('secret') querySecret: string,
    @Ip() ip: string,
  ): Promise<GmailWebhookResponseDto> {
    this.logger.log(`📥 Gmail webhook received from IP: ${ip}`);
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
    if (!payload || !payload.message) {
      this.logger.error('❌ Empty webhook payload received');
      throw new BadRequestException('Empty payload');
    }

    return this.gmailService.processWebhook(payload as any, ip);
  }


  

  /**
   * Test endpoint - Webhook'u manuel test etmek için
   */
  @Post('webhook/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Test webhook with sample data' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testWebhook(@Body() payload: any): Promise<GmailWebhookResponseDto> {
    this.logger.log('🧪 Test webhook triggered');
    return this.gmailService.processWebhook(payload, 'test');
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * GMAIL WATCH MANAGEMENT
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Gmail watch'ı başlat
   */
  @Post('watch/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Start Gmail watch',
    description: 'Set up Gmail watch to receive push notifications via Pub/Sub',
  })
  @ApiResponse({ status: 200, description: 'Watch started successfully' })
  async startWatch(@Body() setupDto: GmailWatchSetupDto) {
    this.logger.log('🚀 Starting Gmail watch...');
    return this.gmailService.setupGmailWatch(setupDto);
  }

  /**
   * Gmail watch'ı durdur
   */
  @Post('watch/stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Stop Gmail watch' })
  @ApiResponse({ status: 200, description: 'Watch stopped successfully' })
  async stopWatch() {
    this.logger.log('🛑 Stopping Gmail watch...');
    await this.gmailService.stopGmailWatch();
    return { 
      success: true, 
      message: 'Gmail watch stopped successfully',
      timestamp: new Date(),
    };
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
  @ApiOperation({ summary: 'Get Gmail webhook logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async getLogs(@Query() query: GmailLogQueryDto) {
    return this.gmailService.getLogs(query);
  }

  /**
   * İstatistikleri getir
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Gmail webhook statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getStats(@Query('days') days?: number) {
    return this.gmailService.getStats(days || 7);
  }

  /**
   * Mapping config'i getir
   */
  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Gmail mapping configuration' })
  async getConfig() {
    return this.gmailService.getMappingConfig();
  }

  /**
   * Mapping config'i güncelle
   */
  @Patch('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update Gmail mapping configuration' })
  async updateConfig(@Body() config: GmailMappingConfigDto) {
    return this.gmailService.updateMappingConfig(config);
  }

  /**
   * Başarısız lead'i yeniden işle
   */
  @Post('logs/:id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retry failed webhook' })
  async retryWebhook(@Param('id') id: number): Promise<GmailWebhookResponseDto> {
    return this.gmailService.retryLead(id);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check for Gmail webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'gmail-webhook',
      timestamp: new Date().toISOString(),
      secretValidation: this.enableSecretValidation ? 'enabled' : 'disabled',
    };
  }



  @Post('process-latest')
@UseGuards(JwtAuthGuard)
async processLatestMessage() {
  this.logger.log('🧪 Manual trigger: Processing latest unread message');
  
  try {
    // Son okunmamış mesajı al
    const response = await this.gmailService['gmail'].users.messages.list({
      userId: 'me',
      maxResults: 1,
      labelIds: ['INBOX'],
      q: 'is:unread'
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return { 
        success: false, 
        message: 'No unread messages found' 
      };
    }

    const messageId = response.data.messages[0].id;
    
    // Mesajı detaylı al
    const message = await this.gmailService['gmail'].users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    this.logger.log(`📧 Processing message: ${messageId}`);

    // Mock payload oluştur
    const mockPayload = {
      message: {
        data: Buffer.from(JSON.stringify({
          emailAddress: 'drguderhair.info@gmail.com',
          historyId: message.data.historyId
        })).toString('base64'),
        messageId: 'manual-trigger',
        publishTime: new Date().toISOString()
      },
      subscription: 'projects/valdoricrmtr1/subscriptions/gmail-webhook-sub'
    };

    // Direkt process et
    const result = await this.gmailService['processMessage'](
      message.data,
      mockPayload,
      '127.0.0.1',
      Date.now()
    );

    return result;
  } catch (error) {
    this.logger.error(`Error in manual trigger: ${error.message}`);
    return { 
      success: false, 
      message: error.message 
    };
  }
}

@Get('list-unread')
@UseGuards(JwtAuthGuard)
async listUnreadMessages() {
  try {
    const response = await this.gmailService['gmail'].users.messages.list({
      userId: 'me',
      maxResults: 10,
      labelIds: ['INBOX'],
      q: 'is:unread'
    });

    if (!response.data.messages) {
      return { count: 0, messages: [] };
    }

    const messages = [];
    for (const msg of response.data.messages) {
      const message = await this.gmailService['gmail'].users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });

      const getHeader = (name: string) => {
        const header = message.data.payload.headers.find(
          h => h.name.toLowerCase() === name.toLowerCase()
        );
        return header ? header.value : '';
      };

      messages.push({
        id: msg.id,
        from: getHeader('From'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: message.data.snippet
      });
    }

    return { 
      count: messages.length, 
      messages 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.message 
    };
  }
}


}

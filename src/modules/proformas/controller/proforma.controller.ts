import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  Res,
  HttpStatus,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { Response } from 'express';
import { ProformaService } from '../services/proforma.service';
import { CreateProformaDto } from '../dto/create.proforma.dto';
import { UpdateProformaDto } from '../dto/update.proforma.dto';
import { CurrentUserId } from 'src/core/decorators/current-user.decorator';

@Controller('proformas')
export class ProformaController {
  constructor(private readonly proformaService: ProformaService) {}

  @Post()
  async create(@Body() createProformaDto: CreateProformaDto, @CurrentUserId() userId) {
    return await this.proformaService.create(createProformaDto, userId);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('patientId') patientId?: number,
    @Query('saleId') saleId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.proformaService.findAll({
      status,
      patientId,
      saleId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * HTML Preview endpoint - İNDİRME İZNİ KONTROLÜ İLE
   */
  @Get(':id/preview/:uuid')
  async getHTMLPreview(
    @Param('id') id: string, 
    @Param('uuid') uuid: any, 
    @Res() res: Response,
  ) {
    try {
      const proforma = await this.proformaService.findOne(+id);
    

      // ✅ İndirme izni kontrolü
      const canDownload = await this.proformaService.canUserDownloadProforma(
        proforma,
        uuid
      );
 

      if (!canDownload) {
        return res.status(HttpStatus.FORBIDDEN).json({
          message: 'Bu proformayı indirme yetkiniz yok. Lütfen onay bekleyin.',
          error: 'Forbidden',
        });
      }

      const html = await this.proformaService.generateHTMLPreview(+id);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to generate HTML preview',
        error: error.message,
      });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.proformaService.findOne(+id);
  }

  @Get('number/:proformaNumber')
  async findByProformaNumber(@Param('proformaNumber') proformaNumber: string) {
    return await this.proformaService.findByProformaNumber(proformaNumber);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProformaDto: UpdateProformaDto,
  ) {
    return await this.proformaService.update(+id, updateProformaDto);
  }

  /**
   * ✅ İndirme onayı verme endpoint'i
   */
  @Patch(':id/approve-download')
  async approveDownload(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
  ) {
    return await this.proformaService.approveDownload(+id, userId);
  }

  /**
   * ✅ İndirme onayını iptal etme endpoint'i
   */
  @Patch(':id/revoke-download')
  async revokeDownload(@Param('id') id: string) {
    return await this.proformaService.revokeDownload(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.proformaService.remove(+id);
    return { message: 'Proforma deleted successfully' };
  }

  @Get('from-sale/:saleId')
  async getProformaFromSale(@Param('saleId') saleId: string) {
    return await this.proformaService.getProformaDataFromSale(+saleId);
  }
}
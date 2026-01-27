import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ExcelSyncService } from './excel-sync.service';
import { AnalyzeExcelDto, ImportExcelDto } from './dto/excel-import.dto';

// Multer configuration for Excel file uploads
const excelStorage = diskStorage({
  destination: (_req, _file, callback) => {
    const uploadPath = join(process.cwd(), 'uploads', 'excel-imports');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    callback(null, uploadPath);
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const baseName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50);
    callback(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const excelFileFilter = (_req: any, file: Express.Multer.File, callback: any) => {
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    callback(null, true);
  } else {
    callback(
      new HttpException('Sadece Excel dosyaları (.xlsx, .xls) kabul edilir', HttpStatus.BAD_REQUEST),
      false,
    );
  }
};

@Controller('excel-sync')
export class ExcelSyncController {
  constructor(private readonly excelSyncService: ExcelSyncService) {}

  /**
   * POST /excel-sync/upload
   * Upload an Excel file for import
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: excelStorage,
      fileFilter: excelFileFilter,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Dosya gereklidir', HttpStatus.BAD_REQUEST);
    }

    return {
      success: true,
      fileId: file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      filePath: file.path,
    };
  }

  /**
   * POST /excel-sync/analyze
   * Analyze an uploaded Excel file
   */
  @Post('analyze')
  async analyzeFile(@Body() dto: AnalyzeExcelDto) {
    if (!dto.fileId) {
      throw new HttpException('fileId gereklidir', HttpStatus.BAD_REQUEST);
    }
    return this.excelSyncService.analyzeExcelFile(dto.fileId);
  }

  /**
   * POST /excel-sync/import
   * Start the import process
   */
  @Post('import')
  async startImport(@Body() importDto: ImportExcelDto) {
    if (!importDto.kisilerFileId) {
      throw new HttpException('kisilerFileId gereklidir', HttpStatus.BAD_REQUEST);
    }

    const jobId = await this.excelSyncService.startImport(importDto);
    return {
      success: true,
      jobId,
      message: 'İçe aktarma başlatıldı',
    };
  }

  /**
   * GET /excel-sync/job/:jobId
   * Get the status of an import job
   */
  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.excelSyncService.getJobStatus(jobId);
  }

  /**
   * GET /excel-sync/status
   * Get the status of the Excel sync service
   */
  @Get('status')
  async getStatus() {
    return {
      status: 'ready',
      message: 'Excel sync endpoint hazır',
      endpoints: {
        upload: {
          method: 'POST',
          path: '/excel-sync/upload',
          description: 'Excel dosyası yükle',
          body: 'multipart/form-data with "file" field',
        },
        analyze: {
          method: 'POST',
          path: '/excel-sync/analyze',
          description: 'Yüklenen dosyayı analiz et',
          body: '{ "fileId": "string" }',
        },
        import: {
          method: 'POST',
          path: '/excel-sync/import',
          description: 'İçe aktarmayı başlat',
          body: '{ "kisilerFileId": "string", "notlarFileId": "string (optional)" }',
        },
        jobStatus: {
          method: 'GET',
          path: '/excel-sync/job/:jobId',
          description: 'İş durumunu sorgula',
        },
      },
    };
  }
}

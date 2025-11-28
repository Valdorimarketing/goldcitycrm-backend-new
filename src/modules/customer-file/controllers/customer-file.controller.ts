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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CustomerFileService } from '../services/customer-file.service';
import {
  CreateCustomerFileDto,
  UpdateCustomerFileDto,
  CustomerFileResponseDto,
} from '../dto/create-customer-file.dto';
import { CustomerFile } from '../entities/customer-file.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';

// 3GB limit (bytes cinsinden)
const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB

@Controller('customer-files')
@UseGuards(JwtAuthGuard)
export class CustomerFileController {
  constructor(private readonly customerFileService: CustomerFileService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads', 'customer-files');
          // Ensure directory exists
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          // Dosya adından özel karakterleri temizle
          const originalName = file.originalname
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_+/g, '_');
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const baseName = originalName.replace(ext, '');
          const filename = `${baseName}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (_req, file, callback) => {
        // Desteklenen MIME türleri
        const allowedMimeTypes = [
          // Görüntüler
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/webp',
          // PDF
          'application/pdf',
          // Arşiv dosyaları
          'application/zip',
          'application/x-zip-compressed',
          'application/x-rar-compressed',
          'application/vnd.rar',
          'application/x-7z-compressed',
          'application/octet-stream',
          // Video dosyaları
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
          'video/webm',
          'video/avi',
          // Office dosyaları
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        // Desteklenen uzantılar
        const allowedExtensions = [
          '.pdf',
          '.png',
          '.jpg',
          '.jpeg',
          '.gif',
          '.webp',
          '.zip',
          '.rar',
          '.7z',
          '.mp4',
          '.mov',
          '.avi',
          '.mkv',
          '.webm',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
        ];

        const ext = extname(file.originalname).toLowerCase();

        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Desteklenmeyen dosya türü: ${ext}. Desteklenen türler: ${allowedExtensions.join(', ')}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: MAX_FILE_SIZE, // 3GB
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('customer') customer: string,
    @Body('description') description?: string,
    @CurrentUserId() userId?: number,
  ): Promise<CustomerFileResponseDto> {
    if (!file) {
      throw new BadRequestException('Dosya gereklidir');
    }

    if (!customer) {
      throw new BadRequestException('Müşteri ID gereklidir');
    }

    const customerId = parseInt(customer);
    if (isNaN(customerId)) {
      throw new BadRequestException('Müşteri ID geçerli bir sayı olmalıdır');
    }

    const createCustomerFileDto: CreateCustomerFileDto = {
      customer: customerId,
      file: `uploads/customer-files/${file.filename}`,
      description: description,
    };

    return this.customerFileService.createCustomerFile(createCustomerFileDto, userId);
  }

  @Get()
  async findAll(@Query('customer') customer?: string): Promise<CustomerFile[]> {
    if (customer) {
      return this.customerFileService.getCustomerFilesByCustomer(+customer);
    }
    return this.customerFileService.getAllCustomerFiles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerFile> {
    return this.customerFileService.getCustomerFileById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerFileDto: UpdateCustomerFileDto,
  ): Promise<CustomerFileResponseDto> {
    return this.customerFileService.updateCustomerFile(+id, updateCustomerFileDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUserId() userId?: number,
  ): Promise<CustomerFile> {
    return this.customerFileService.deleteCustomerFile(+id, userId);
  }
}
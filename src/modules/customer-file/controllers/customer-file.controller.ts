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
import { extname } from 'path';
import { CustomerFileService } from '../services/customer-file.service';
import {
  CreateCustomerFileDto,
  UpdateCustomerFileDto,
  CustomerFileResponseDto,
} from '../dto/create-customer-file.dto';
import { CustomerFile } from '../entities/customer-file.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';

@Controller('customer-files')
@UseGuards(JwtAuthGuard)
export class CustomerFileController {
  constructor(private readonly customerFileService: CustomerFileService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/customer-files',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.originalname.replace(ext, '')}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async create(
    @UploadedFile() file: any,
    @Body('customer') customer: string,
    @Body('description') description?: string,
    @CurrentUserId() userId?: number,
  ): Promise<CustomerFileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!customer) {
      throw new BadRequestException('Customer ID is required');
    }

    const customerId = parseInt(customer);
    if (isNaN(customerId)) {
      throw new BadRequestException('Customer ID must be a valid number');
    }

    const createCustomerFileDto: CreateCustomerFileDto = {
      customer: customerId,
      file: file.path,
      description: description,
    };

    return this.customerFileService.createCustomerFile(
      createCustomerFileDto,
      userId,
    );
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
    return this.customerFileService.updateCustomerFile(
      +id,
      updateCustomerFileDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<CustomerFile> {
    return this.customerFileService.deleteCustomerFile(+id);
  }
}

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
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express'; // Bu import'u ekleyin
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { CustomerService } from '../services/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CheckPhoneResponseDto,
  TodayAssignmentDto,
} from '../dto/create-customer.dto';
import { CustomerQueryFilterDto } from '../dto/customer-query-filter.dto';
import { Customer } from '../entities/customer.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { CustomerEngagementService } from 'src/modules/customer-engagement/services/customer-engagement.service';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly notificationService: NotificationService,
    private readonly customerEngagementService: CustomerEngagementService,
  ) { }

  /**
   * Transform multipart form data to CreateCustomerDto/UpdateCustomerDto
   * Converts string values to appropriate types (numbers, booleans, arrays)
   */
  private transformCustomerDto(
    body: any,
  ): CreateCustomerDto | UpdateCustomerDto {
    const dto: any = {};

    // String fields - no transformation needed
    const stringFields = [
      'name',
      'surname',
      'title',
      'email',
      'gender',
      'birthDate',
      'patient',
      'phone',
      'job',
      'website',
      'district',
      'address',
      'url',
      'checkup_package',
      'description',
      'image',
      'relatedTransaction'
    ];

    stringFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== '') {
        dto[field] = body[field];
      }
    });

    // Number fields - convert from string to number
    const numberFields = [
      'user',
      'sourceId',
      'identityNumber',
      'referanceCustomer',
      'language',
      'status',
      'country',
      'state',
      'city',
      'postalCode',
      'relevantUser',
    ];

    numberFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== '') {
        const value = parseInt(body[field], 10);
        if (!isNaN(value)) {
          dto[field] = value;
        }
      }
    });

    // Boolean field
    if (body.isActive !== undefined && body.isActive !== '') {
      dto.isActive = body.isActive === 'true' || body.isActive === true;
    }

    // Date field
    if (body.remindingDate !== undefined && body.remindingDate !== '') {
      dto.remindingDate = new Date(body.remindingDate);
    }

    // Dynamic fields - parse JSON string if needed
    if (body.dynamicFields !== undefined) {
      try {
        dto.dynamicFields =
          typeof body.dynamicFields === 'string'
            ? JSON.parse(body.dynamicFields)
            : body.dynamicFields;
      } catch {
        // If JSON parsing fails, keep as-is or set to empty array
        dto.dynamicFields = [];
      }
    }

    return dto;
  }



 

  @Get('assignments/today')
  async getTodayAssignments(): Promise<TodayAssignmentDto[]> {
    return this.customerService.getTodayAssignments();
  }


  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CustomerResponseDto> {
    const createCustomerDto = this.transformCustomerDto(body);

    if (file) {
      createCustomerDto.image = file.path;
    }
    return this.customerService.createCustomer(createCustomerDto);
  }


   

  @Get('check-phone')
  @ApiOperation({ summary: 'Check if phone number exists or similar numbers' })
  @ApiResponse({
    status: 200,
    description: 'Phone check result with similar matches',
  })
  async checkPhoneCheck(@Query('phone') phone: string): Promise<any> {
    const result = await this.customerService.checkPhoneWithSimilar(phone);
    return result;
  }

  @Get('export')
  @ApiOperation({ summary: 'Export customers as Excel or CSV' })
  @ApiResponse({
    status: 200,
    description: 'File exported successfully',
  })
  async exportCustomers(
    @Query('format') format: 'excel' | 'csv',
    @Query('columns') columns: string,
    @Query('exportAll') exportAll: string, // Query param olarak string gelir
    @Query() filters: CustomerQueryFilterDto,
    @CurrentUserId() userId: number,
    @Res() res: Response
  ): Promise<void> {
    const selectedColumns = columns ? columns.split(',').map(c => c.trim()) : undefined;
    const shouldExportAll = exportAll === 'true';

    const buffer = await this.customerService.exportCustomers(
      format,
      userId,
      filters,
      selectedColumns,
      shouldExportAll
    );

    // Dosya adını oluştur
    const scopeText = shouldExportAll ? 'all' : `page${filters.page || 1}`;
    const filename = `customers_${scopeText}_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'csv'}`;

    res.set({
      'Content-Type': format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.status(HttpStatus.OK).send(buffer);
  }


  // customer.controller.ts
  @Get('assignments/my-today')
  @ApiOperation({ summary: 'Get my assignments for today' })
  async getMyTodayAssignments(@CurrentUserId() userId: number) {
    return this.customerService.getMyTodayAssignments(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
  })
  async findAll(@Query() query: any) {

   if(query){
    if(query.page){
      query.page = Number(query.page);
    }
    if(query.limit){
      query.limit = Number(query.limit);
    }

    if(query.hasRelevantUser){
      query.hasRelevantUser = query.hasRelevantUser == 'false' ? false : true;
    }
   }
   
    const queryBuilder =
      await this.customerService.findByFiltersBaseQuery(query);
    return this.customerService.paginate(queryBuilder, query, Customer);
  }

  @Get(':id')
  async getCustomer(@Param('id') id: number, @CurrentUserId() userId: number) {
    return this.customerService.getCustomerById(id, userId);
  }

  @Get('dynamic-search/user-stats')
    async getDynamicSearchUserStats() {
      return this.customerService.getDynamicSearchUserStats();
    }

  @Post(':id/view-phone')
  async viewPhone(@Param('id') id: number, @Request() req) {
    const userId = req.user?.id;
    await this.customerEngagementService.registerPhoneView(id, userId);
    return { success: true };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUserId() userId: number,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CustomerResponseDto> {
    const updateCustomerDto = this.transformCustomerDto(body);

    // Giriş yapan kullanıcıyı da DTO'ya ekle
    const dtoWithUser = {
      ...updateCustomerDto,
      user: userId,
    };

    if (file) {
      dtoWithUser.image = file.path;
    }

    // Önce müşteri kaydını güncelle
    const updated = await this.customerService.updateCustomer(+id, dtoWithUser);

    // Eğer müşteri bir kullanıcıya atanmışsa, bildirim gönder
    if (dtoWithUser.relevantUser) {
      await this.notificationService.createForUser(
        dtoWithUser.relevantUser,
        `Size yeni bir müşteri atandı: ${updated.name || 'Bilinmeyen Müşteri'}`
      );
    }

    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Customer> {
    return this.customerService.deleteCustomer(+id);
  }
}
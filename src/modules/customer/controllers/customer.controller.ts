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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { CustomerService } from '../services/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
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

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

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
      'phone',
      'job',
      'website',
      'district',
      'address',
      'description',
      'image',
      'relatedTransaction',
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

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
  })
  async findAll(@Query() query: CustomerQueryFilterDto) {
    const queryBuilder =
      await this.customerService.findByFiltersBaseQuery(query);
    return this.customerService.paginate(queryBuilder, query, Customer);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customerService.getCustomerById(+id);
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

    // User ID'yi DTO'ya ekle
    const dtoWithUser = {
      ...updateCustomerDto,
      user: userId,
    };

    if (file) {
      dtoWithUser.image = file.path;
    }

    return this.customerService.updateCustomer(+id, dtoWithUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Customer> {
    return this.customerService.deleteCustomer(+id);
  }
}

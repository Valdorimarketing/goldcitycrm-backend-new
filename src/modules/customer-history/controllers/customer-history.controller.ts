import { Controller, Get, Query } from '@nestjs/common';
import { CustomerHistoryService } from '../services/customer-history.service';
import { CustomerHistory } from '../entities/customer-history.entity';

@Controller('customer-history')
export class CustomerHistoryController {
  constructor(
    private readonly customerHistoryService: CustomerHistoryService,
  ) {}

  @Get()
  async findAll(
    @Query('customer') customer?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    // Pagination parametreleri
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;

    // Eğer pagination varsa, yeni metodu kullan
    if (pageNumber && limitNumber) {
      let startDateTime = undefined;
      let endDateTime = undefined;

      if (startDate) {
        startDateTime = new Date(startDate);
        if (startDate.length === 10) {
          startDateTime.setHours(0, 0, 0, 0);
        }
      }

      if (endDate) {
        endDateTime = new Date(endDate);
        if (endDate.length === 10) {
          endDateTime.setHours(23, 59, 59, 999);
        }
      }

      const skip = (pageNumber - 1) * limitNumber;

      const result = await this.customerHistoryService.getCustomerHistoryWithPagination({
        customer: customer ? +customer : undefined,
        userId: userId ? +userId : undefined,
        action,
        startDate: startDateTime,
        endDate: endDateTime,
        skip,
        take: limitNumber,
      });

      return {
        data: result.data,
        meta: {
          page: pageNumber,
          limit: limitNumber,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNumber),
        },
      };
    }

    // Eski endpoint davranışı (backward compatibility)
    // Tarih filtrelemesi varsa
    if (startDate || endDate || action || userId) {
      let startDateTime = undefined;
      let endDateTime = undefined;

      if (startDate) {
        startDateTime = new Date(startDate);
        if (startDate.length === 10) {
          startDateTime.setHours(0, 0, 0, 0);
        }
      }

      if (endDate) {
        endDateTime = new Date(endDate);
        if (endDate.length === 10) {
          endDateTime.setHours(23, 59, 59, 999);
        }
      }

      // userId varsa pagination olmadan filtreleme yap
      if (userId) {
        const result = await this.customerHistoryService.getCustomerHistoryWithPagination({
          customer: customer ? +customer : undefined,
          userId: +userId,
          action,
          startDate: startDateTime,
          endDate: endDateTime,
          skip: 0,
          take: 1000, // Pagination olmadan tümünü çek (max 1000)
        });

        return result.data;
      }

      return this.customerHistoryService.getCustomerHistoryByDateRange({
        customer: customer ? +customer : undefined,
        action,
        startDate: startDateTime,
        endDate: endDateTime,
      });
    }

    if (customer) {
      return this.customerHistoryService.getCustomerHistoryByCustomer(
        +customer,
      );
    }

    return this.customerHistoryService.getAllCustomerHistory();
  }
}
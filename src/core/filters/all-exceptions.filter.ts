import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = undefined;

    console.error('Exception caught:', exception);

    if (exception instanceof HttpException) {
      // Handle HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        details = (exceptionResponse as any).error;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle TypeORM query errors
      const error = exception as any;

      if (error.code === 'ER_DUP_ENTRY') {
        status = HttpStatus.CONFLICT;
        errorCode = 'DUPLICATE_ENTRY';

        // Parse duplicate entry message
        const sqlMessage = error.sqlMessage || '';
        const match = sqlMessage.match(/Duplicate entry '(.+)' for key '(.+)'/);

        if (match) {
          const [, value, key] = match;
          const fieldName = this.extractFieldName(key);

          message = `Bu ${fieldName} değeri zaten kullanılıyor: "${value}"`;
          details = {
            field: fieldName,
            value: value,
            constraint: key,
          };
        } else {
          message = 'Bu kayıt zaten mevcut. Lütfen farklı bir değer deneyin.';
        }
      } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'FOREIGN_KEY_VIOLATION';
        message = 'İlişkili kayıt bulunamadı.';
      } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        status = HttpStatus.CONFLICT;
        errorCode = 'REFERENCED_RECORD';
        message = 'Bu kayıt başka kayıtlar tarafından kullanılıyor ve silinemez.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'DATABASE_ERROR';
        message = 'Veritabanı işlemi başarısız oldu.';
        details = {
          code: error.code,
          sqlMessage: error.sqlMessage,
        };
      }
    } else if (exception.name === 'ValidationError') {
      // Handle validation errors
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_ERROR';
      message = 'Girdiğiniz bilgilerde hatalar var.';
      details = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    console.error('Error response:', errorResponse);

    response.status(status).json(errorResponse);
  }

  private extractFieldName(constraint: string): string {
    // IDX_9c06cbb83feb2f0be6263bd47e → code
    // branches_code_unique → code
    // UQ_branch_code → code

    const fieldMappings: Record<string, string> = {
      code: 'branş kodu',
      name: 'ad',
      email: 'e-posta',
      phone: 'telefon',
    };

    // Try to extract field name from constraint
    const parts = constraint.toLowerCase().split('_');

    for (const part of parts) {
      if (fieldMappings[part]) {
        return fieldMappings[part];
      }
    }

    // Check if 'code' is in constraint name
    if (constraint.includes('code') || constraint.includes('IDX_9c06cbb83feb2f0be6263bd47e')) {
      return 'branş kodu';
    }

    return 'değer';
  }
}
import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomHttpException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(message, status);
  }

  static notFound(entityName: string): CustomHttpException {
    return new CustomHttpException(
      `${entityName} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  static badRequest(message: string): CustomHttpException {
    return new CustomHttpException(message, HttpStatus.BAD_REQUEST);
  }

  static unauthorized(message: string = 'Unauthorized'): CustomHttpException {
    return new CustomHttpException(message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Forbidden'): CustomHttpException {
    return new CustomHttpException(message, HttpStatus.FORBIDDEN);
  }

  static conflict(message: string): CustomHttpException {
    return new CustomHttpException(message, HttpStatus.CONFLICT);
  }
}

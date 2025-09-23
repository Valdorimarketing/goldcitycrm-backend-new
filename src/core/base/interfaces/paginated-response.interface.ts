import { PaginationDto } from '../dtos/pagination.dto';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationDto;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateActionListDto } from './create-action-list.dto';

export class UpdateActionListDto extends PartialType(CreateActionListDto) {}

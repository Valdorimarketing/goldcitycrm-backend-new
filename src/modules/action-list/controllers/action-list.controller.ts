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
} from '@nestjs/common';
import { ActionListService } from '../services/action-list.service';
import { CreateActionListDto } from '../dto/create-action-list.dto';
import { UpdateActionListDto } from '../dto/update-action-list.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('action-list')
@UseGuards(JwtAuthGuard)
export class ActionListController {
  constructor(private readonly actionListService: ActionListService) {}

  @Post()
  create(@Body() createActionListDto: CreateActionListDto) {
    return this.actionListService.createActionList(createActionListDto);
  }

  @Get()
  findAll() {
    return this.actionListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionListService.findById(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActionListDto: UpdateActionListDto,
  ) {
    return this.actionListService.updateActionList(+id, updateActionListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actionListService.remove(+id);
  }
}

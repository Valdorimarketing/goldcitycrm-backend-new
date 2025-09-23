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
import { SourceService } from '../services/source.service';
import {
  CreateSourceDto,
  UpdateSourceDto,
  SourceResponseDto,
} from '../dto/source.dto';
import { Source } from '../entities/source.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';

@Controller('sources')
@UseGuards(JwtAuthGuard)
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Post()
  async create(
    @Body() createSourceDto: CreateSourceDto,
  ): Promise<SourceResponseDto> {
    return this.sourceService.create(createSourceDto, SourceResponseDto);
  }

  @Get()
  async findAll(@Query() queryDto: BaseQueryFilterDto) {
    const queryBuilder =
      this.sourceService.sourceRepository.createSourceQueryBuilder('source');
    return this.sourceService.paginate(
      queryBuilder,
      queryDto,
      SourceResponseDto,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Source> {
    return this.sourceService.findById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSourceDto: UpdateSourceDto,
  ): Promise<SourceResponseDto> {
    return this.sourceService.update(updateSourceDto, +id, SourceResponseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Source> {
    return this.sourceService.remove(+id);
  }
}

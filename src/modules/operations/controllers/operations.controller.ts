// operations.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    UsePipes,
    ValidationPipe,
    Param,
    Delete,
    Patch,
    UseGuards,
    Req
} from '@nestjs/common';
import { OperationsService } from '../services/operations.service';
import { CreateScheduleDto, UpdateFollowupItemDto } from '../dto/create-schedule.dto';
import { CreateOperationTypeDto } from '../dto/create-operation-type.dto';
import { CurrentUserId } from 'src/core/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('operations')
export class OperationsController {
    constructor(private readonly operationsService: OperationsService) { }

    @Get('/types')
    async getOperationTypes() {
        return this.operationsService.listOperationTypes();
    }

    @Post('/types')
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async addOperationType(@Body() dto: CreateOperationTypeDto, @CurrentUserId() userId: number) {
        const type = await this.operationsService.createOperationType(dto, userId);
        return { success: true, data: type };
    }

    // Tek bir operasyon kaydı oluşturacak (followups JSON içinde tutulacak)
    @Post('/schedule')
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async scheduleOperation(@Body() dto: CreateScheduleDto, @CurrentUserId() userId: number) {
        const result = await this.operationsService.createFollowupPlan(dto, userId);
        return { success: true, data: result };
    }

    // Müşteriye ait operasyon kayıtlarını getir (her kaydın içinde followups JSON var)
    @Get('/followups/:customerId')
    async listCustomerFollowups(@Param('customerId') customerId: number) {
        const data = await this.operationsService.listCustomerFollowups(customerId);
        return { success: true, data };
    }

    @Delete('/schedule/:id')
    async deleteSchedule(@Param('id') id: number) {
        const result = await this.operationsService.deleteFollowup(id);
        return { success: true, deleted: result };
    }

    @Patch('followups/:id/item')
    @UseGuards(JwtAuthGuard)
    async updateFollowupItem(
    @Param('id') id: number,
    @Body() payload: { kind: 'day' | 'month'; offset: number; done?: boolean; note?: string },
    @Req() req: any
    ) {
    const userId = req.user?.id || req.user?.userId;
    return this.operationsService.updateFollowupInSchedule(id, payload, userId);
    }

    // Root schedule içindeki followup (gün/ay) öğesini güncellemek için
    // Body: { kind: 'day'|'month', offset: number, done?: boolean, note?: string }
    @Patch('/followups/:id/followup')
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async updateFollowupInSchedule(
        @Param('id') id: number,
        @Body() dto: UpdateFollowupItemDto
    ) {
        const result = await this.operationsService.updateFollowupInSchedule(id, {
            kind: dto.kind,
            offset: dto.offset,
            done: dto.done,
            note: dto.note,
        });
        return { success: true, data: result };
    }

    @Get('/notifications')
    async getNotifications() {
        const data = await this.operationsService.checkDueFollowups();
        return data;
    }
}

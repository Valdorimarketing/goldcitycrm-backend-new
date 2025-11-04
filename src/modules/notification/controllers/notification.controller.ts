import { Controller, Delete, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { NotificationService } from "../services/notification.service";
import { CurrentUserId } from "src/core/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";

// notification.controller.ts

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) { }

  @Get()
  async getUserNotifications(@CurrentUserId() userId: number) {
    return this.service.findAllForUser(userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: number) {
    await this.service.markAsRead(+id);
    return { success: true };
  }


  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUserId() userId: number) {
    await this.service.markAllAsRead(userId);
    return { success: true };
  }

  @Delete('delete-read')
  async deleteAll(@CurrentUserId() userId: number) {
    await this.service.deleteAll(userId);
    return { success: true, message: 'Tüm bildirimler silindi' };
  }
 

}

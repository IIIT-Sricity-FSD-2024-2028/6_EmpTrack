import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Notifications')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Get notifications for user' })
  @Get('user/:empId')
  getNotificationsForUser(@Param('empId') empId: string) {
    return this.notificationService.getNotificationsForUser(empId);
  }

  @Post()
  createNotification(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createDto);
  }
}

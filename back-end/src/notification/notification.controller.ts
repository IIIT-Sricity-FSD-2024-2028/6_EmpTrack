import { Controller, Get, Param, Post, Body, UseGuards, Headers } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Get your own notifications' })
  @Get('user/:empId')
  getNotificationsForUser(@Param('empId') empId: string, @Headers('x-actor-id') actorId: string) {
    return this.notificationService.getNotificationsForUser(empId, actorId);
  }

  @ApiOperation({ summary: 'Send a notification to an employee you manage' })
  @Post()
  createNotification(@Body() createDto: CreateNotificationDto, @Headers('x-actor-id') actorId: string) {
    return this.notificationService.sendAsActor(createDto, actorId);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Activity Logs')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('activity-logs')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @ApiOperation({ summary: 'Platform Admin activity feed, filterable by user/action/company' })
  @Get()
  getAll(@Query('userId') userId?: string, @Query('action') action?: string, @Query('companyId') companyId?: string) {
    return this.activityLogService.getAll(userId, action, companyId);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Platform Analytics')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('analytics')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Overview summary cards for the Super Admin dashboard' })
  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @ApiOperation({ summary: 'Monthly company growth. range: today|7d|30d|6m|1y, or from/to for a custom range' })
  @Get('company-growth')
  getCompanyGrowth(@Query('range') range?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getCompanyGrowth(range, from, to);
  }

  @Get('employee-growth')
  getEmployeeGrowth(@Query('range') range?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getEmployeeGrowth(range, from, to);
  }

  @Get('subscription-distribution')
  getSubscriptionDistribution() {
    return this.analyticsService.getSubscriptionDistribution();
  }

  @Get('platform-activity')
  getPlatformActivity(@Query('range') range?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getPlatformActivity(range, from, to);
  }
}

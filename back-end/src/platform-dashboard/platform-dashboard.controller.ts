import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PlatformDashboardService } from './platform-dashboard.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolvePlatformAdminScope } from '../common/utils/platform-scope.util';

@ApiTags('Platform Admin: Dashboard')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('platform-dashboard')
@UseGuards(RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformDashboardController {
  constructor(private readonly service: PlatformDashboardService) {}

  @ApiOperation({ summary: 'Summary stats for the logged-in Platform Admin' })
  @Get('summary')
  getSummary(@Headers('x-actor-id') actorId: string) {
    return this.service.getSummary(resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }
}

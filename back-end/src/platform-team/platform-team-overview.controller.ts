import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PlatformTeamService } from './platform-team.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolvePlatformAdminScope } from '../common/utils/platform-scope.util';

@ApiTags('Platform Admin: Team Workload')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('platform-team')
@UseGuards(RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformTeamOverviewController {
  constructor(private readonly service: PlatformTeamService) {}

  @ApiOperation({ summary: 'Combined Technical + Support Team workload' })
  @Get('workload')
  getWorkload(@Headers('x-actor-id') actorId: string) {
    return this.service.getWorkload(resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }
}

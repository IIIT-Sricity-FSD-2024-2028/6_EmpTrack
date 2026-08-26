import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamDto, CreateTeamLeadDto } from './dto/team.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Teams')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('teams')
@UseGuards(RolesGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  private actor(actorId: string, actorName: string, role: string) {
    return { emp_id: actorId, emp_name: actorName || 'Company Admin', role: role || 'COMPANY_ADMIN' };
  }

  @ApiOperation({ summary: "List teams for the caller's own company" })
  @Get()
  @Roles('COMPANY_ADMIN', 'HR', 'TEAMLEAD')
  getTeams(@Headers('x-actor-id') actorId: string) {
    return this.teamService.getTeams(actorId);
  }

  @ApiOperation({ summary: 'Create a team for the caller\'s own company' })
  @Post()
  @Roles('COMPANY_ADMIN')
  createTeam(
    @Body() dto: CreateTeamDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.teamService.createTeam(dto, this.actor(actorId, actorName, role));
  }

  @ApiOperation({ summary: 'Create the Team Lead for a team the caller owns' })
  @Post(':id/lead')
  @Roles('COMPANY_ADMIN')
  createTeamLead(
    @Param('id') id: string,
    @Body() dto: CreateTeamLeadDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.teamService.createTeamLead(id, dto, this.actor(actorId, actorName, role));
  }
}

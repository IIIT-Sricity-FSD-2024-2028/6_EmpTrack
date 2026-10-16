import { Controller, Get, Post, Patch, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { EscalationService } from './escalation.service';
import { CreateEscalationDto } from './dto/escalation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Escalations')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('escalations')
@UseGuards(RolesGuard)
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @ApiOperation({ summary: 'Get escalations created by the authenticated Team Lead' })
  @Get('mine')
  @Roles('TEAMLEAD')
  getMine(@Headers('x-actor-id') actorId: string) {
    return this.escalationService.getEscalationsForActor(actorId);
  }

  @ApiOperation({ summary: 'Get all escalations' })
  @Get()
  @Roles('HR')
  getAllEscalations(@Headers('x-actor-id') actorId: string) {
    return this.escalationService.getAllEscalations(actorId);
  }

  @Post()
  createEscalation(@Body() createDto: CreateEscalationDto, @Headers('x-actor-id') actorId: string) {
    return this.escalationService.createEscalation(createDto, actorId);
  }

  @Patch(':id/reject')
  @Roles('HR')
  rejectEscalation(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.escalationService.rejectEscalation(id, actorId);
  }

  @Post(':id/report')
  @Roles('HR')
  generateReport(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.escalationService.generateEscalationReport(id, actorId);
  }
}


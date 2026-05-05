import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Get all escalations' })
  @Get()
  @Roles('HR', 'ADMIN')
  getAllEscalations() {
    return this.escalationService.getAllEscalations();
  }

  @Post()
  createEscalation(@Body() createDto: CreateEscalationDto) {
    return this.escalationService.createEscalation(createDto);
  }

  @Patch(':id/reject')
  @Roles('HR', 'ADMIN')
  rejectEscalation(@Param('id') id: string) {
    return this.escalationService.rejectEscalation(id);
  }

  @Post(':id/report')
  @Roles('HR', 'ADMIN')
  generateReport(@Param('id') id: string) {
    return this.escalationService.generateEscalationReport(id);
  }
}


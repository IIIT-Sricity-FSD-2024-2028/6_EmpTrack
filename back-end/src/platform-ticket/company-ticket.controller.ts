import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PlatformTicketService } from './platform-ticket.service';
import { RaiseTicketDto } from './dto/platform-ticket.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Company Admin's own "raise an issue" entry point - separate from
// technical-issue.controller.ts / support-ticket.controller.ts, which are
// Platform Admin's view of the same ticket data.
@ApiTags('Company Admin: Raise Issue')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('company/tickets')
@UseGuards(RolesGuard)
@Roles('COMPANY_ADMIN')
export class CompanyTicketController {
  constructor(private readonly service: PlatformTicketService) {}

  @ApiOperation({ summary: 'Raise an issue - notifies only the Platform Admin assigned to this company' })
  @Post()
  raise(
    @Body() dto: RaiseTicketDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.raiseTicket(dto, { emp_id: actorId, emp_name: actorName || 'Company Admin', role: 'COMPANY_ADMIN' });
  }
}

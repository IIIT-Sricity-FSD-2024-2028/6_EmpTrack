import { Controller, Get, Post, Body, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateCompanyEventDto, CreateEventDto } from './dto/calendar.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Calendar')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('calendar')
@UseGuards(RolesGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: 'Company holidays for the requester\'s company' })
  @Get('holidays')
  @Roles('COMPANY_ADMIN', 'HR', 'TEAMLEAD', 'EMPLOYEE')
  getHolidays(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.calendarService.getHolidays(requesterEmpId, role, year, month);
  }

  @ApiOperation({ summary: 'Company events visible to the requester\'s role' })
  @Get('company-events')
  @Roles('COMPANY_ADMIN', 'HR', 'TEAMLEAD')
  getCompanyEvents(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.calendarService.getCompanyEvents(requesterEmpId, role, year, month);
  }

  @ApiOperation({ summary: 'Create a company event (HR/Admin)' })
  @Post('company-events')
  @Roles('COMPANY_ADMIN', 'HR')
  createCompanyEvent(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Body() dto: CreateCompanyEventDto,
  ) {
    return this.calendarService.createCompanyEvent(requesterEmpId, role, dto);
  }

  @ApiOperation({ summary: 'Create a personal event on the header calendar popover (owned by the requester)' })
  @Post('events')
  @Roles('EMPLOYEE', 'TEAMLEAD', 'HR', 'COMPANY_ADMIN')
  createEvent(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.calendarService.createPersonalEvent(requesterEmpId, role, dto);
  }

  @ApiOperation({ summary: 'Own leaves/tasks/holidays only - no target-employee param exists' })
  @Get('my-calendar')
  @Roles('EMPLOYEE')
  getMyCalendar(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.calendarService.getMyCalendar(requesterEmpId, role, year, month);
  }

  @ApiOperation({ summary: 'Team-scoped calendar for a Team Lead\'s direct reports' })
  @Get('team-calendar')
  @Roles('TEAMLEAD')
  getTeamCalendar(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.calendarService.getTeamCalendar(requesterEmpId, role, year, month);
  }

  @ApiOperation({ summary: 'Company-wide calendar (HR/Admin), scoped to their own company' })
  @Get('company-calendar')
  @Roles('HR', 'COMPANY_ADMIN')
  getCompanyCalendar(
    @Query('requesterEmpId') requesterEmpId: string,
    @Headers('role') role: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.calendarService.getCompanyCalendar(requesterEmpId, role, year, month);
  }
}

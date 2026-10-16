import { Controller, Get, Param, Post, Patch, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Leaves')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('leaves')
@UseGuards(RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @ApiOperation({ summary: 'Get all leaves (HR/TeamLead)' })
  @Get()
  @Roles('HR', 'TEAMLEAD', 'COMPANY_ADMIN')
  getAllLeaves(@Headers('x-actor-id') actorId: string) {
    return this.leaveService.getAllLeaves(actorId);
  }

  @ApiOperation({ summary: 'Pending leaves the caller may decide (HR queue / Team Lead queue)' })
  @Get('review-queue')
  @Roles('HR', 'TEAMLEAD')
  getReviewQueue(@Headers('x-actor-id') actorId: string) {
    return this.leaveService.getReviewQueue(actorId);
  }

  @Get('user/:empId')
  getLeavesForUser(@Param('empId') empId: string, @Headers('x-actor-id') actorId: string) {
    return this.leaveService.getLeavesForUser(empId, actorId);
  }

  @Post()
  @Roles('EMPLOYEE', 'TEAMLEAD', 'COMPANY_ADMIN')
  createLeave(@Body() createDto: CreateLeaveDto, @Headers('x-actor-id') actorId: string) {
    return this.leaveService.createLeave(createDto, actorId);
  }

  @Patch(':id/status')
  @Roles('HR', 'TEAMLEAD', 'COMPANY_ADMIN')
  updateLeaveStatus(
    @Param('id') leaveId: string,
    @Body() updateDto: UpdateLeaveStatusDto,
    @Headers('x-actor-id') actorId: string,
  ) {
    return this.leaveService.updateLeaveStatus(leaveId, updateDto, actorId);
  }
}


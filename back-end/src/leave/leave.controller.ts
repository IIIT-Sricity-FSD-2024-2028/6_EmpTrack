import { Controller, Get, Param, Post, Patch, Body, UseGuards } from '@nestjs/common';
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
  @Roles('HR', 'TEAMLEAD', 'ADMIN')
  getAllLeaves() {
    return this.leaveService.getAllLeaves();
  }

  @Get('user/:empId')
  getLeavesForUser(@Param('empId') empId: string) {
    return this.leaveService.getLeavesForUser(empId);
  }

  @Post()
  @Roles('EMPLOYEE', 'TEAMLEAD', 'ADMIN')
  createLeave(@Body() createDto: CreateLeaveDto) {
    return this.leaveService.createLeave(createDto);
  }

  @Patch(':id/status')
  @Roles('HR', 'TEAMLEAD', 'ADMIN')
  updateLeaveStatus(
    @Param('id') leaveId: string,
    @Body() updateDto: UpdateLeaveStatusDto
  ) {
    return this.leaveService.updateLeaveStatus(leaveId, updateDto);
  }
}

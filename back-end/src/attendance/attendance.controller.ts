import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, CheckOutDto } from './dto/attendance.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Attendance')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({ summary: 'Get attendance for specific user' })
  @Get('user/:empId')
  getAttendanceForUser(@Param('empId') empId: string) {
    return this.attendanceService.getAttendanceForUser(empId);
  }

  @Post('check-in')
  markAttendance(@Body() markDto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(markDto);
  }

  @Post('check-out')
  markCheckOut(@Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.markCheckOut(checkOutDto);
  }
}

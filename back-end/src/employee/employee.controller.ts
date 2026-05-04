import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Employees')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('employees')
@UseGuards(RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @ApiOperation({ summary: 'Get all employees' })
  @Get()
  @Roles('HR', 'TEAMLEAD', 'ADMIN')
  getAllEmployees(@Query('managerId') managerId: string) {
    if (managerId) {
      return this.employeeService.getUsersByManager(managerId);
    }
    return this.employeeService.getAllEmployees();
  }

  @Get(':id')
  getEmployeeById(@Param('id') id: string) {
    return this.employeeService.getEmployeeById(id);
  }

  @Get('email/:email')
  getEmployeeByEmail(@Param('email') email: string) {
    return this.employeeService.getEmployeeByEmail(email);
  }

  @Patch(':id/password')
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.employeeService.updatePassword(id, updatePasswordDto);
  }
}

import { Controller, Get, Post, Param, Patch, Body, Query, Headers, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Employees')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('employees')
@UseGuards(RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @ApiOperation({ summary: 'Get all employees - scoped to the caller\'s own company for HR/Company Admin, own direct reports for Team Lead' })
  @Get()
  @Roles('HR', 'TEAMLEAD', 'COMPANY_ADMIN')
  getAllEmployees(
    @Query('managerId') managerId: string,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
  ) {
    // A Team Lead can only ever be their own direct reports - the client-supplied
    // managerId query param is ignored entirely for this role so it can't be spoofed
    // to view another Team Lead's employees.
    if (role === 'TEAMLEAD') {
      return this.employeeService.getUsersByManager(actorId);
    }
    if (managerId) {
      return this.employeeService.getUsersByManager(managerId);
    }
    return this.employeeService.getAllEmployees(role, actorId);
  }

  @ApiOperation({ summary: 'Company Admin adds an employee to a team they manage' })
  @Post()
  @Roles('COMPANY_ADMIN')
  createEmployee(
    @Body() dto: CreateEmployeeDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.employeeService.createEmployee(dto, { emp_id: actorId, emp_name: actorName || 'Company Admin', role: role || 'COMPANY_ADMIN' });
  }

  @Get(':id')
  getEmployeeById(@Param('id') id: string) {
    return this.employeeService.getEmployeeById(id);
  }

  @Get('email/:email')
  getEmployeeByEmail(@Param('email') email: string) {
    return this.employeeService.getEmployeeByEmail(email);
  }

  @ApiOperation({ summary: 'Change your own password - requires current password, rejects any other employee id' })
  @Patch(':id/password')
  updatePassword(
    @Param('id') id: string,
    @Headers('x-actor-id') actorId: string,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.employeeService.updatePassword(id, actorId, updatePasswordDto);
  }

  @ApiOperation({ summary: 'Delete an employee' })
  @Delete(':id')
  @Roles('COMPANY_ADMIN')
  deleteEmployee(
    @Param('id') id: string,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.employeeService.deleteEmployee(id, { emp_id: actorId, emp_name: actorName || 'Company Admin', role: role || 'COMPANY_ADMIN' });
  }

  @ApiOperation({ summary: 'Update an employee' })
  @Patch(':id')
  @Roles('COMPANY_ADMIN')
  updateEmployee(
    @Param('id') id: string,
    @Body() updateData: any,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.employeeService.updateEmployee(id, updateData, { emp_id: actorId, emp_name: actorName || 'Company Admin', role: role || 'COMPANY_ADMIN' });
  }
}


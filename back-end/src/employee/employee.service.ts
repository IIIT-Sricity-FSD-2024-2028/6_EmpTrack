import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly dataStore: MockDataService) {}

  getAllEmployees() {
    return this.dataStore.getEmployees();
  }

  getEmployeeById(id: string) {
    const emp = this.dataStore.getEmployees().find(e => e.emp_id === id);
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  getEmployeeByEmail(email: string) {
    const emp = this.dataStore.getEmployees().find(e => e.email === email);
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  getUsersByManager(managerId: string) {
    return this.dataStore.getEmployees().filter(e => e.manager_id === managerId);
  }

  updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    const emp = this.getEmployeeById(id);
    emp.password = updatePasswordDto.newPassword;
    return emp;
  }
}

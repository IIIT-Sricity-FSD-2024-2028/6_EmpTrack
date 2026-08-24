import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { UpdatePasswordDto } from './dto/update-password.dto';

// Same strength rule already enforced client-side on the employee profile page -
// applied server-side too so it can't be bypassed by calling the API directly.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

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

  // actorId comes from the x-actor-id header (this app's existing stand-in for an
  // authenticated identity, set by the frontend from the logged-in user's own
  // session on every request - see store.js's _fetch). It is never trusted from
  // the client-editable :id route param alone, so a caller can't change another
  // employee's password just by editing the URL.
  updatePassword(id: string, actorId: string, dto: UpdatePasswordDto) {
    if (!actorId || actorId !== id) {
      throw new ForbiddenException('You can only change your own password.');
    }

    const emp = this.getEmployeeById(id);

    if (emp.password !== dto.currentPassword) {
      throw new UnauthorizedException('Incorrect current password.');
    }
    if (dto.confirmPassword !== undefined && dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match.');
    }
    if (!STRONG_PASSWORD.test(dto.newPassword)) {
      throw new BadRequestException('Weak password. Use 8+ characters with uppercase, lowercase, a number, and a special character.');
    }

    emp.password = dto.newPassword;

    const { password, ...safeEmployee } = emp;
    return safeEmployee;
  }

  deleteEmployee(id: string) {
    const deleted = this.dataStore.deleteEmployee(id);
    if (!deleted) throw new NotFoundException('Employee not found');
    return { success: true, message: 'Employee deleted' };
  }

  updateEmployee(id: string, updateData: any) {
    const updated = this.dataStore.updateEmployee(id, updateData);
    if (!updated) throw new NotFoundException('Employee not found');
    return updated;
  }
}


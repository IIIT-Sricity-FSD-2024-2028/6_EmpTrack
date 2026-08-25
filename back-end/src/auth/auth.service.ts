import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { LoginDto } from './dto/login.dto';
import { comparePassword } from '../common/utils/password.util';

@Injectable()
export class AuthService {
  constructor(private readonly dataStore: MockDataService) {}

  login(dto: LoginDto) {
    const employee = this.dataStore
      .getEmployees()
      .find((e) => e.email.toLowerCase() === dto.email.toLowerCase());

    // Same generic message whether the email doesn't exist or the password is wrong,
    // so a caller can't use this endpoint to enumerate registered accounts.
    if (!employee || !comparePassword(dto.password, employee.password)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (employee.status && employee.status !== 'ACTIVE') {
      throw new UnauthorizedException('This account is not active. Contact your administrator.');
    }

    const { password, ...safeUser } = employee;
    return { user: this.enrichScope(safeUser) };
  }

  // Attaches human-readable company/platform-admin context alongside the raw
  // companyId / platform_admin_id fields already on the employee record, so the
  // frontend has what it needs without a second round trip right after login.
  private enrichScope(user: any) {
    const scoped: any = { ...user };
    if (user.companyId) {
      const company = this.dataStore.getCompanies().find((c) => c.company_id === user.companyId);
      if (company) scoped.company_name = company.company_name;
    }
    if (user.platform_admin_id) {
      const platformAdmin = this.dataStore.getEmployees().find((e) => e.emp_id === user.platform_admin_id);
      if (platformAdmin) scoped.platform_admin_name = platformAdmin.emp_name;
    }
    return scoped;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { LoginDto } from './dto/login.dto';
import { comparePassword } from '../common/utils/password.util';
import { FileLoggerService } from '../common/logger/file-logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataStore: MockDataService,
    private readonly logger: FileLoggerService,
  ) {}

  login(dto: LoginDto, ip?: string, requestId?: string) {
    const employee = this.dataStore
      .getEmployees()
      .find((e) => e.email.toLowerCase() === dto.email.toLowerCase());

    // Same generic message whether the email doesn't exist or the password is wrong,
    // so a caller can't use this endpoint to enumerate registered accounts.
    if (!employee || !comparePassword(dto.password, employee.password)) {
      this.logger.warn('Failed login attempt', { email: dto.email, ip, requestId });
      this.dataStore.logActivity({
        user_id: employee?.emp_id || 'UNKNOWN',
        user_name: employee?.emp_name || dto.email,
        role: employee?.role || 'UNKNOWN',
        action: 'Failed login attempt',
        details: `Login failed for ${dto.email}.`,
        status: 'WARNING',
      });
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (employee.status && employee.status !== 'ACTIVE') {
      this.logger.warn('Login rejected - inactive account', { email: dto.email, ip, requestId });
      this.dataStore.logActivity({
        user_id: employee.emp_id,
        user_name: employee.emp_name,
        role: employee.role,
        action: 'Login rejected (inactive account)',
        company_id: employee.companyId || null,
        details: `Login attempt on an inactive account.`,
        status: 'WARNING',
      });
      throw new UnauthorizedException('This account is not active. Contact your administrator.');
    }

    this.logger.info('Login succeeded', { userId: employee.emp_id, role: employee.role, ip, requestId });
    this.dataStore.logActivity({
      user_id: employee.emp_id,
      user_name: employee.emp_name,
      role: employee.role,
      action: 'Login',
      company_id: employee.companyId || null,
      details: `${employee.emp_name} logged in.`,
    });

    const { password, ...safeUser } = employee;
    return { user: this.enrichScope(safeUser) };
  }

  logout(actorId: string, actorName: string, role: string) {
    if (actorId) {
      this.logger.info('Logout', { userId: actorId, role });
      this.dataStore.logActivity({
        user_id: actorId,
        user_name: actorName || actorId,
        role: role || 'UNKNOWN',
        action: 'Logout',
        details: `${actorName || actorId} logged out.`,
      });
    }
    return { success: true };
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { MockDataService } from '../data/mock-data.service';
import { hashPassword } from '../common/utils/password.util';

@Injectable()
export class InvitationService {
  constructor(private readonly dataStore: MockDataService) {}

  createInvitation(params: { emp_id: string; email: string; name: string; role: string; company_id: string | null }) {
    const settings = this.dataStore.getPlatformSettings();
    const expiryHours = settings?.security_settings?.invitationExpiryHours || 72;
    const invitation = {
      invitation_id: 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      token: randomBytes(24).toString('hex'),
      emp_id: params.emp_id,
      email: params.email,
      name: params.name,
      role: params.role,
      company_id: params.company_id,
      status: 'PENDING',
      created_date: new Date().toISOString(),
      accepted_date: null,
      expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
    };
    this.dataStore.getInvitations().push(invitation);
    return invitation;
  }

  getAllInvitations() {
    return [...this.dataStore.getInvitations()].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
  }

  getByToken(token: string) {
    const invitation = this.dataStore.getInvitations().find((i) => i.token === token);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status === 'ACCEPTED') throw new BadRequestException('This invitation has already been used');
    if (invitation.status === 'EXPIRED' || new Date(invitation.expires_at).getTime() < Date.now()) {
      invitation.status = 'EXPIRED';
      throw new BadRequestException('This invitation has expired');
    }
    return invitation;
  }

  acceptInvitation(token: string, password: string) {
    const invitation = this.getByToken(token);
    const employee = this.dataStore.getEmployees().find((e) => e.emp_id === invitation.emp_id);
    if (!employee) throw new NotFoundException('The account linked to this invitation no longer exists');

    employee.password = hashPassword(password);
    employee.status = 'ACTIVE';
    invitation.status = 'ACCEPTED';
    invitation.accepted_date = new Date().toISOString();

    this.dataStore.logActivity({
      user_id: employee.emp_id,
      user_name: employee.emp_name,
      role: employee.role,
      action: employee.role === 'PLATFORM_ADMIN' ? 'Platform Admin account activated' : 'Company Admin account activated',
      company_id: employee.companyId || null,
      details: `${employee.emp_name} accepted their invitation and activated their account.`,
    });

    const { password: _pw, ...safeEmployee } = employee;
    return safeEmployee;
  }
}

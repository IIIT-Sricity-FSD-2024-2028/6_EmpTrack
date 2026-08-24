import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

@Injectable()
export class PlatformDashboardService {
  constructor(private readonly dataStore: MockDataService) {}

  getSummary(scopePlatformAdminId: string | null) {
    const companies = this.dataStore.getCompanies().filter((c) => !scopePlatformAdminId || c.platform_admin_id === scopePlatformAdminId);
    const employees = this.dataStore.getEmployees();
    const technicalTeam = employees.filter((e) => e.role === 'TECHNICAL_TEAM' && (!scopePlatformAdminId || e.platform_admin_id === scopePlatformAdminId));
    const supportTeam = employees.filter((e) => e.role === 'SUPPORT_TEAM' && (!scopePlatformAdminId || e.platform_admin_id === scopePlatformAdminId));
    const tickets = this.dataStore.getPlatformTickets().filter((t) => !scopePlatformAdminId || t.platform_admin_id === scopePlatformAdminId);

    const openStatuses = ['OPEN', 'IN_PROGRESS'];
    const escalations = this.dataStore
      .getCriticalEscalations()
      .filter((e) => (!scopePlatformAdminId || e.raised_by === scopePlatformAdminId) && e.status !== 'RESOLVED');

    const recentActivity = [...this.dataStore.getActivityLogs()]
      .filter((a) => !scopePlatformAdminId || a.user_id === scopePlatformAdminId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      assigned_companies: companies.length,
      active_companies: companies.filter((c) => c.status === 'ACTIVE').length,
      technical_team_count: technicalTeam.length,
      active_technical_team: technicalTeam.filter((m) => m.status === 'ACTIVE').length,
      support_team_count: supportTeam.length,
      active_support_team: supportTeam.filter((m) => m.status === 'ACTIVE').length,
      open_technical_issues: tickets.filter((t) => t.ticket_type === 'TECHNICAL' && openStatuses.includes(t.status)).length,
      open_support_tickets: tickets.filter((t) => t.ticket_type === 'SUPPORT' && openStatuses.includes(t.status)).length,
      pending_escalations: escalations.length,
      recent_activity: recentActivity,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly dataStore: MockDataService) {}

  getAll(userId?: string, action?: string, companyId?: string) {
    let logs = this.dataStore.getActivityLogs();
    if (userId) logs = logs.filter((l) => l.user_id === userId);
    if (action) logs = logs.filter((l) => l.action === action);
    if (companyId) logs = logs.filter((l) => l.company_id === companyId);
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateWorkLogDto } from './dto/worklog.dto';

@Injectable()
export class WorkLogService {
  constructor(private readonly dataStore: MockDataService) {}

  getWorkLogsForUser(empId: string) {
    return this.dataStore.getWorkLogs().filter(wl => wl.emp_id === empId);
  }

  createWorkLog(createDto: CreateWorkLogDto) {
    const newLog = {
        worklog_id: 'WL-' + Math.floor(1000 + Math.random() * 9000),
        ...createDto,
        log_date: new Date().toISOString().split('T')[0]
    };
    this.dataStore.getWorkLogs().push(newLog);
    return newLog;
  }
}


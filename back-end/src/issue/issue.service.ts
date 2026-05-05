import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateIssueDto } from './dto/issue.dto';

@Injectable()
export class IssueService {
  constructor(private readonly dataStore: MockDataService) {}

  getIssuesForUser(empId: string) {
    return this.dataStore.getIssues().filter(i => i.emp_id === empId);
  }

  createIssue(createDto: CreateIssueDto) {
    const newIssue = {
        issue_id: 'ISS-' + Math.floor(1000 + Math.random() * 9000),
        ...createDto,
        status: 'Open',
        assigned_to: 'Unassigned',
        raised_date: new Date().toISOString().split('T')[0],
        updates: []
    };
    this.dataStore.getIssues().push(newIssue);
    return newIssue;
  }
}


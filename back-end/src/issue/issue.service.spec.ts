import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { IssueService } from './issue.service';

describe('IssueService workflow rules', () => {
  const employees = [
    { emp_id: 'EM001', emp_name: 'Employee', role: 'EMPLOYEE', companyId: 'C001', manager_id: 'TL001' },
    { emp_id: 'TL001', emp_name: 'Lead', role: 'TEAMLEAD', companyId: 'C001' },
    { emp_id: 'EM002', emp_name: 'Other', role: 'EMPLOYEE', companyId: 'C001', manager_id: 'TL002' },
    { emp_id: 'TL002', emp_name: 'Other Lead', role: 'TEAMLEAD', companyId: 'C001' },
  ];
  const issue = { issue_id: 'ISS-1', emp_id: 'EM001', status: 'Open', assigned_to: 'Unassigned' };
  const store = {
    getIssues: jest.fn(() => [issue]),
    getEmployees: jest.fn(() => employees),
    getTasks: jest.fn(() => []),
  };
  const persistence = {
    seedIssues: jest.fn(),
    getIssue: jest.fn(() => issue),
    saveIssue: jest.fn(),
    createIssue: jest.fn(),
  };
  const service = new IssueService(store as any, persistence as any);

  it('rejects an employee trying to create an issue for another employee', () => {
    expect(() => service.createIssue({ emp_id: 'EM002' } as any, 'EM001')).toThrow(ForbiddenException);
  });

  it('prevents resolving an issue without resolution details', () => {
    expect(() => service.updateIssue('ISS-1', { status: 'Resolved' }, 'TL001')).toThrow(BadRequestException);
  });

  it('prevents a Team Lead from updating an issue outside their reporting scope', () => {
    expect(() => service.updateIssue('ISS-1', { priority: 'High' }, 'TL002')).toThrow(ForbiddenException);
  });

  it('requires assignment before moving an issue to In Progress', () => {
    expect(() => service.updateIssue('ISS-1', { assigned_to: 'Unknown Person' }, 'TL001')).toThrow(ForbiddenException);
  });
});

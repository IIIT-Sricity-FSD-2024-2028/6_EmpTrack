import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IssueService } from '../issue/issue.service';
import { EscalationService } from '../escalation/escalation.service';
import { WorkflowPersistenceService } from './workflow-persistence.service';

describe('issue and HR escalation lifecycle with SQLite persistence', () => {
  let directory: string;
  let previousDbPath: string | undefined;
  let persistence: WorkflowPersistenceService;
  let issueService: IssueService;
  let escalationService: EscalationService;
  const employees = [
    { emp_id: 'EM001', emp_name: 'Employee One', role: 'EMPLOYEE', companyId: 'C001', manager_id: 'TL001' },
    { emp_id: 'EM002', emp_name: 'Other Employee', role: 'EMPLOYEE', companyId: 'C002', manager_id: 'TL002' },
    { emp_id: 'EM004', emp_name: 'Employee Two', role: 'EMPLOYEE', companyId: 'C001', manager_id: 'TL001' },
    { emp_id: 'TL001', emp_name: 'Team Lead', role: 'TEAMLEAD', companyId: 'C001' },
    { emp_id: 'HR001', emp_name: 'HR Manager', role: 'HR', companyId: 'C001' },
    { emp_id: 'EM002', emp_name: 'Other Employee', role: 'EMPLOYEE', companyId: 'C002', manager_id: 'TL002' },
    { emp_id: 'TL002', emp_name: 'Other Lead', role: 'TEAMLEAD', companyId: 'C002' },
  ];
  let issues: any[];
  let escalations: any[];
  let dataStore: any;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'emptrack-lifecycle-'));
    previousDbPath = process.env.EMPTRACK_WORKFLOW_DB;
    process.env.EMPTRACK_WORKFLOW_DB = join(directory, 'workflow.sqlite');
    issues = [];
    escalations = [];
    dataStore = {
      getIssues: () => issues,
      getEmployees: () => employees,
      getTasks: () => [],
      getEscalations: () => escalations,
    };
    persistence = new WorkflowPersistenceService();
    issueService = new IssueService(dataStore, persistence);
    escalationService = new EscalationService(dataStore, persistence);
  });

  afterEach(() => {
    persistence.onModuleDestroy();
    if (previousDbPath === undefined) delete process.env.EMPTRACK_WORKFLOW_DB;
    else process.env.EMPTRACK_WORKFLOW_DB = previousDbPath;
    rmSync(directory, { recursive: true, force: true });
  });

  it('raises, assigns, escalates to HR, resolves, and retains records across reopen', () => {
    const created = issueService.createIssue({
      title: 'VPN unavailable', type: 'Technical', priority: 'High', description: 'VPN disconnects throughout the work day.',
    } as any, 'EM001');
    expect(issueService.getIssuesForUser('EM001', 'EM001')).toContainEqual(expect.objectContaining({ issue_id: created.issue_id }));
    expect(() => issueService.getIssuesForUser('EM001', 'EM002')).toThrow(ForbiddenException);

    issueService.updateIssue(created.issue_id, { assigned_to: 'Employee Two', status: 'In Progress' } as any, 'TL001');
    expect(() => issueService.updateIssue(created.issue_id, { status: 'Open' } as any, 'TL001')).toThrow(BadRequestException);
    expect(() => issueService.updateIssue(created.issue_id, { status: 'Resolved' } as any, 'TL001')).toThrow(BadRequestException);

    const escalation = escalationService.createEscalation({
      reference_type: 'Technical', reference_id: 'EM001', issue_id: created.issue_id,
      escalated_to: 'HR', escalation_reason: 'The team needs HR support with this blocking issue.', priority: 'High',
    } as any, 'TL001');
    expect(escalationService.getAllEscalations('HR001')).toContainEqual(expect.objectContaining({ escalation_id: escalation.escalation_id }));
    expect(() => escalationService.createEscalation({
      reference_type: 'Technical', reference_id: 'EM001', issue_id: created.issue_id,
      escalated_to: 'HR', escalation_reason: 'The team needs HR support with this blocking issue.',
    } as any, 'TL001')).toThrow(ConflictException);
    expect(() => escalationService.createEscalation({
      reference_type: 'Technical', reference_id: 'EM002', escalated_to: 'HR', escalation_reason: 'Cross tenant escalation attempt.',
    } as any, 'TL001')).toThrow(ForbiddenException);

    issueService.updateIssue(created.issue_id, {
      status: 'Resolved', resolution: {
        type: 'Workaround', time_spent: 1, root_cause: 'VPN credential expired for the employee account.',
        actions_taken: 'Renewed the credential and verified connectivity after restarting the VPN client.',
      },
    } as any, 'TL001');
    expect(issueService.getIssuesForUser('EM001', 'EM001')[0].status).toBe('Resolved');

    persistence.onModuleDestroy();
    persistence = new WorkflowPersistenceService();
    expect(persistence.getIssue(created.issue_id)).toMatchObject({ status: 'Resolved', resolution: { resolved_by: 'TL001' } });
    expect(persistence.getEscalations()).toContainEqual(expect.objectContaining({ escalation_id: escalation.escalation_id, issue_id: created.issue_id }));
  });

  it('leaves memory unchanged when a durable issue write fails', () => {
    const before = issues.length;
    persistence.onModuleDestroy();
    expect(() => issueService.createIssue({
      title: 'Database failure case', type: 'Technical', priority: 'Medium',
      description: 'The failed durable write must not produce a successful in-memory issue.',
    } as any, 'EM001')).toThrow();
    expect(issues).toHaveLength(before);
    persistence = new WorkflowPersistenceService();
  });
});

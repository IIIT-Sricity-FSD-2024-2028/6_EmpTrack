import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkflowPersistenceService } from './workflow-persistence.service';

describe('WorkflowPersistenceService', () => {
  let directory: string;
  let databaseFile: string;
  let store: WorkflowPersistenceService;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'emptrack-workflow-'));
    databaseFile = join(directory, 'workflow.sqlite');
    process.env.EMPTRACK_WORKFLOW_DB = databaseFile;
    store = new WorkflowPersistenceService();
  });

  afterEach(() => {
    store.onModuleDestroy();
    delete process.env.EMPTRACK_WORKFLOW_DB;
    rmSync(directory, { recursive: true, force: true });
  });

  it('persists issue and escalation records after reopening the database', () => {
    const issue = { issue_id: 'ISS-PERSIST', emp_id: 'EM001', status: 'In Progress', title: 'Persist me' };
    const escalation = { escalation_id: 'ESC-PERSIST', escalated_from: 'TL001', escalated_to: 'HR', reference_type: 'issue', reference_id: 'ISS-PERSIST', status: 'OPEN' };
    store.saveIssue(issue);
    store.saveEscalation(escalation);
    store.onModuleDestroy();

    const reopened = new WorkflowPersistenceService();
    expect(reopened.getIssue('ISS-PERSIST')).toEqual(issue);
    expect(reopened.getEscalations()).toEqual([escalation]);
    reopened.onModuleDestroy();
    store = new WorkflowPersistenceService();
  });

  it('rolls back seed import if a seed batch fails', () => {
    const invalid = { emp_id: 'EM001', status: 'Open' }; // required key absent
    expect(() => store.seedIssues([invalid])).toThrow();
    expect(store.getIssues()).toEqual([]);
  });

  it('rejects duplicate active issues and duplicate open escalations', () => {
    const issue = { issue_id: 'ISS-DUP-1', emp_id: 'EM001', status: 'Open', title: 'Duplicate', description: 'Same report' };
    store.createIssue(issue);
    expect(() => store.createIssue({ ...issue, issue_id: 'ISS-DUP-2' })).toThrow('already exists');

    const escalation = { escalation_id: 'ESC-DUP-1', escalated_from: 'TL001', escalated_to: 'HR', reference_type: 'Workload', reference_id: 'EM001', status: 'OPEN' };
    store.createEscalation(escalation);
    expect(() => store.createEscalation({ ...escalation, escalation_id: 'ESC-DUP-2' })).toThrow('already exists');
  });
});

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

  it('persists task updates and work logs across database reopen, rejecting duplicates safely', () => {
    const task = { task_id: 'TK-PERSIST', assigned_to: 'EM001', status: 'NOT_STARTED', progress_percentage: 0 };
    const log = {
      worklog_id: 'WL-PERSIST', emp_id: 'EM001', task_id: task.task_id,
      start_time: '2026-10-16T09:00:00.000Z', end_time: '2026-10-16T11:00:00.000Z',
      hours_spent: 2, description: 'Persisted task work.',
    };
    store.createTask(task);
    store.saveTask({ ...task, status: 'COMPLETED', progress_percentage: 100 });
    store.createWorkLog(log);
    expect(() => store.createWorkLog({ ...log, worklog_id: 'WL-DUPLICATE' })).toThrow('already exists');
    expect(() => store.deleteTask(task.task_id)).toThrow('logged work');
    store.onModuleDestroy();

    const reopened = new WorkflowPersistenceService();
    expect(reopened.getTask(task.task_id)).toMatchObject({ status: 'COMPLETED', progress_percentage: 100 });
    expect(reopened.getWorkLogsForEmployee('EM001')).toContainEqual(log);
    reopened.onModuleDestroy();
    store = new WorkflowPersistenceService();
  });

  it('atomically persists and recovers active, stopped, and confirmed work timer sessions', () => {
    const started = {
      session_id: 'WS-PERSIST', employee_id: 'EM001', task_id: 'TK001', task_title: 'Timer task',
      start_time: '2026-10-17T09:00:00.000Z', created_at: '2026-10-17T09:00:00.000Z', updated_at: '2026-10-17T09:00:00.000Z',
    };
    store.startWorkSession(started);
    expect(() => store.startWorkSession({ ...started, session_id: 'WS-DUPLICATE', task_id: 'TK002' })).toThrow('already have a work session');
    expect(store.getOpenWorkSession('EM001').status).toBe('ACTIVE');
    const stopped = store.stopWorkSession('EM001', started.session_id, '2026-10-17T10:15:00.000Z');
    expect(stopped).toMatchObject({ status: 'STOPPED', elapsed_ms: 75 * 60 * 1000 });
    store.onModuleDestroy();

    const reopened = new WorkflowPersistenceService();
    expect(reopened.getOpenWorkSession('EM001')).toMatchObject({ session_id: started.session_id, status: 'STOPPED' });
    const log = {
      worklog_id: 'WL-TIMER-PERSIST', emp_id: 'EM001', task_id: 'TK001', task_title: 'Timer task',
      start_time: started.start_time, end_time: stopped.stop_time, elapsed_ms: stopped.elapsed_ms,
      hours_spent: 1.25, description: 'Implemented and tested this task timer.', log_date: '2026-10-17',
      updated_at: stopped.stop_time,
    };
    expect(reopened.saveStoppedWorkSession('EM001', started.session_id, log.description, log)).toEqual(log);
    expect(reopened.saveStoppedWorkSession('EM001', started.session_id, log.description, null)).toEqual(log);
    expect(reopened.getWorkLogsForEmployee('EM001')).toEqual([log]);
    expect(reopened.getOpenWorkSession('EM001')).toBeNull();
    reopened.onModuleDestroy();
    store = new WorkflowPersistenceService();
  });

  it('migrates demo identities once and persists registrations, company admins, and sessions', () => {
    const seedUser = { emp_id: 'DEMO-1', emp_name: 'Demo', email: 'demo@example.test', password: 'bcrypt-hash', role: 'EMPLOYEE', status: 'ACTIVE', companyId: null };
    const seedCompany = { company_id: 'DEMO-C1', company_name: 'Demo Co', company_email: 'demo-co@example.test' };
    expect(store.initializeIdentityData([seedUser], [seedCompany]).users).toHaveLength(1);
    const registration = {
      reference: 'REG-DURABLE', status: 'verified', token_hash: 'opaque-token-hash',
      company: { legal_name: 'Durable Co', registration_number: 'R-1', company_email: 'durable@example.test' },
      admin: { name: 'A User', email: 'admin@durable.example.test', password_hash: 'admin-bcrypt-hash' },
    };
    const company = { company_id: 'COMP-DURABLE', company_name: 'Durable Co', company_email: 'durable@example.test', registration_number: 'R-1', registration_reference: registration.reference };
    const admin = { emp_id: 'CA-DURABLE', emp_name: 'A User', email: 'admin@durable.example.test', password: 'admin-bcrypt-hash', role: 'COMPANY_ADMIN', status: 'ACTIVE', companyId: company.company_id, registration_reference: registration.reference };
    store.activateRegistration(registration, company, admin);
    store.createSession('raw-session-token', admin.emp_id, Date.now() + 60_000);
    store.onModuleDestroy();

    const reopened = new WorkflowPersistenceService();
    const identity = reopened.initializeIdentityData([seedUser], [seedCompany]);
    expect(identity.users).toContainEqual(expect.objectContaining({ emp_id: admin.emp_id, password: 'admin-bcrypt-hash', role: 'COMPANY_ADMIN' }));
    expect(identity.companies).toContainEqual(expect.objectContaining({ company_id: company.company_id }));
    expect(reopened.getCompanyRegistration(registration.reference).status).toBe('verified');
    expect(reopened.resolveSession('raw-session-token')).toBe(admin.emp_id);
    expect(reopened.getUserByEmail(' ADMIN@DURABLE.EXAMPLE.TEST ')).toMatchObject({ companyId: company.company_id });
    reopened.onModuleDestroy();
    store = new WorkflowPersistenceService();
  });

  it('rolls back a company and registration when the durable account email conflicts', () => {
    const user = { emp_id: 'EXISTING', emp_name: 'Existing', email: 'same@example.test', password: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE', companyId: 'C1' };
    store.initializeIdentityData([user], [{ company_id: 'C1', company_name: 'First', company_email: 'first@example.test' }]);
    const registration = { reference: 'REG-ROLLBACK', status: 'verified', token_hash: 'hash', company: { legal_name: 'Second', company_email: 'second@example.test' }, admin: { email: 'same@example.test' } };
    const company = { company_id: 'C2', company_name: 'Second', company_email: 'second@example.test', registration_reference: registration.reference };
    const duplicateAdmin = { emp_id: 'DUPLICATE', emp_name: 'Duplicate', email: 'SAME@example.test', password: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE', companyId: 'C2' };
    expect(() => store.activateRegistration(registration, company, duplicateAdmin)).toThrow('already exists');
    expect(store.getCompany('C2')).toBeNull();
    expect(store.getCompanyRegistration(registration.reference)).toBeNull();
    expect(store.getUserByEmail('same@example.test').emp_id).toBe('EXISTING');
  });
});

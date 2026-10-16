import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** Durable store for issue, escalation, task, and work-log workflows. Other demo features remain in MockDataService. */
@Injectable()
export class WorkflowPersistenceService implements OnModuleDestroy {
  private readonly db: DatabaseSync;

  constructor() {
    const file = resolve(process.env.EMPTRACK_WORKFLOW_DB || 'data/workflow.sqlite');
    mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS workflow_issues (
        issue_id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS workflow_issues_employee_idx ON workflow_issues(employee_id);
      CREATE INDEX IF NOT EXISTS workflow_issues_status_idx ON workflow_issues(status);
      CREATE TABLE IF NOT EXISTS workflow_escalations (
        escalation_id TEXT PRIMARY KEY,
        raised_by TEXT NOT NULL,
        recipient TEXT NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        issue_id TEXT,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS workflow_escalations_recipient_idx ON workflow_escalations(recipient, status);
      CREATE INDEX IF NOT EXISTS workflow_escalations_reference_idx ON workflow_escalations(reference_type, reference_id);
      CREATE TABLE IF NOT EXISTS workflow_tasks (
        task_id TEXT PRIMARY KEY,
        assigned_to TEXT NOT NULL,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS workflow_tasks_assignee_idx ON workflow_tasks(assigned_to, status);
      CREATE TABLE IF NOT EXISTS workflow_work_logs (
        worklog_id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        record_json TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS workflow_work_logs_submission_idx
        ON workflow_work_logs(employee_id, task_id, start_time, end_time);
      CREATE INDEX IF NOT EXISTS workflow_work_logs_employee_idx ON workflow_work_logs(employee_id);
      INSERT OR IGNORE INTO workflow_migrations(version) VALUES (1);
    `);
    this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS workflow_tasks_request_idx
      ON workflow_tasks(json_extract(record_json, '$.client_request_id'))
      WHERE json_extract(record_json, '$.client_request_id') IS NOT NULL`);
    const columns = this.db.prepare('PRAGMA table_info(workflow_escalations)').all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === 'issue_id')) this.db.exec('ALTER TABLE workflow_escalations ADD COLUMN issue_id TEXT');
    this.db.exec('CREATE INDEX IF NOT EXISTS workflow_escalations_issue_idx ON workflow_escalations(issue_id)');
  }

  private putIssue(issue: any) {
    this.db.prepare(`INSERT INTO workflow_issues(issue_id, employee_id, status, record_json)
      VALUES (?, ?, ?, ?) ON CONFLICT(issue_id) DO UPDATE SET
      employee_id=excluded.employee_id, status=excluded.status, record_json=excluded.record_json`)
      .run(issue.issue_id, issue.emp_id, issue.status, JSON.stringify(issue));
  }

  /** Imports demo fixtures once, and only when no prior workflow data exists. */
  seedIssues(issues: any[]) {
    const marker = this.db.prepare('SELECT 1 FROM workflow_migrations WHERE version = 2').get();
    if (marker) return;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const count = this.db.prepare('SELECT COUNT(*) AS n FROM workflow_issues').get() as { n: number };
      if (count.n === 0) for (const issue of issues) this.putIssue(issue);
      this.db.prepare('INSERT INTO workflow_migrations(version) VALUES (2)').run();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  getIssuesForEmployee(employeeId: string) {
    return (this.db.prepare('SELECT record_json FROM workflow_issues WHERE employee_id = ? ORDER BY rowid').all(employeeId) as any[])
      .map((row) => JSON.parse(row.record_json));
  }

  getIssues() {
    return (this.db.prepare('SELECT record_json FROM workflow_issues ORDER BY rowid').all() as any[])
      .map((row) => JSON.parse(row.record_json));
  }

  getIssue(id: string) {
    const row = this.db.prepare('SELECT record_json FROM workflow_issues WHERE issue_id = ?').get(id) as { record_json: string } | undefined;
    return row ? JSON.parse(row.record_json) : null;
  }

  createIssue(issue: any) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const duplicate = this.db.prepare(`SELECT 1 FROM workflow_issues
        WHERE employee_id = ? AND status <> 'Resolved'
        AND lower(trim(json_extract(record_json, '$.title'))) = lower(trim(?))
        AND lower(trim(json_extract(record_json, '$.description'))) = lower(trim(?)) LIMIT 1`)
        .get(issue.emp_id, issue.title, issue.description);
      if (duplicate) throw new ConflictException('An active issue with the same title and description already exists.');
      this.putIssue(issue);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  saveIssue(issue: any) { this.putIssue(issue); }

  private putEscalation(record: any) {
    this.db.prepare(`INSERT INTO workflow_escalations(escalation_id, raised_by, recipient, reference_type, reference_id, issue_id, status, record_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(escalation_id) DO UPDATE SET
      raised_by=excluded.raised_by, recipient=excluded.recipient, reference_type=excluded.reference_type,
      reference_id=excluded.reference_id, issue_id=excluded.issue_id, status=excluded.status, record_json=excluded.record_json`)
      .run(record.escalation_id, record.escalated_from, record.escalated_to, record.reference_type,
        record.reference_id, record.issue_id || null, record.status, JSON.stringify(record));
  }

  seedEscalations(escalations: any[]) {
    const marker = this.db.prepare('SELECT 1 FROM workflow_migrations WHERE version = 3').get();
    if (marker) return;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const count = this.db.prepare('SELECT COUNT(*) AS n FROM workflow_escalations').get() as { n: number };
      if (count.n === 0) for (const escalation of escalations) this.putEscalation(escalation);
      this.db.prepare('INSERT INTO workflow_migrations(version) VALUES (3)').run();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  getEscalations() {
    return (this.db.prepare('SELECT record_json FROM workflow_escalations ORDER BY rowid').all() as any[])
      .map((row) => JSON.parse(row.record_json));
  }

  saveEscalation(record: any) { this.putEscalation(record); }

  createEscalation(record: any) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const duplicate = this.db.prepare(`SELECT 1 FROM workflow_escalations
        WHERE raised_by = ? AND status = 'OPEN' AND (
          (? IS NOT NULL AND issue_id = ?) OR
          (? IS NULL AND issue_id IS NULL AND reference_type = ? AND reference_id = ?)
        ) LIMIT 1`)
        .get(record.escalated_from, record.issue_id || null, record.issue_id || null,
          record.issue_id || null, record.reference_type, record.reference_id);
      if (duplicate) throw new ConflictException('An open escalation already exists for this reference.');
      this.putEscalation(record);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private putTask(task: any) {
    this.db.prepare(`INSERT INTO workflow_tasks(task_id, assigned_to, status, record_json)
      VALUES (?, ?, ?, ?) ON CONFLICT(task_id) DO UPDATE SET
      assigned_to=excluded.assigned_to, status=excluded.status, record_json=excluded.record_json`)
      .run(task.task_id, task.assigned_to, task.status, JSON.stringify(task));
  }

  seedTasks(tasks: any[]) {
    if (this.db.prepare('SELECT 1 FROM workflow_migrations WHERE version = 4').get()) return;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const count = this.db.prepare('SELECT COUNT(*) AS n FROM workflow_tasks').get() as { n: number };
      if (count.n === 0) for (const task of tasks) this.putTask(task);
      this.db.prepare('INSERT INTO workflow_migrations(version) VALUES (4)').run();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  getTasks() {
    return (this.db.prepare('SELECT record_json FROM workflow_tasks ORDER BY rowid').all() as any[])
      .map((row) => JSON.parse(row.record_json));
  }

  getTask(id: string) {
    const row = this.db.prepare('SELECT record_json FROM workflow_tasks WHERE task_id = ?').get(id) as { record_json: string } | undefined;
    return row ? JSON.parse(row.record_json) : null;
  }

  getTaskByClientRequestId(requestId: string) {
    const row = this.db.prepare(`SELECT record_json FROM workflow_tasks
      WHERE json_extract(record_json, '$.client_request_id') = ?`).get(requestId) as { record_json: string } | undefined;
    return row ? JSON.parse(row.record_json) : null;
  }

  createTask(task: any) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (task.client_request_id && this.getTaskByClientRequestId(task.client_request_id)) {
        throw new ConflictException('This task submission has already been processed.');
      }
      this.db.prepare('INSERT INTO workflow_tasks(task_id, assigned_to, status, record_json) VALUES (?, ?, ?, ?)')
        .run(task.task_id, task.assigned_to, task.status, JSON.stringify(task));
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  saveTask(task: any) { this.putTask(task); }

  deleteTask(id: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const hasLogs = this.db.prepare('SELECT 1 FROM workflow_work_logs WHERE task_id = ? LIMIT 1').get(id);
      if (hasLogs) throw new ConflictException('Tasks with logged work cannot be deleted.');
      const result = this.db.prepare('DELETE FROM workflow_tasks WHERE task_id = ?').run(id);
      this.db.exec('COMMIT');
      return Number(result.changes) > 0;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  seedWorkLogs(workLogs: any[]) {
    if (this.db.prepare('SELECT 1 FROM workflow_migrations WHERE version = 5').get()) return;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const count = this.db.prepare('SELECT COUNT(*) AS n FROM workflow_work_logs').get() as { n: number };
      if (count.n === 0) for (const log of workLogs) this.putWorkLog(log);
      this.db.prepare('INSERT INTO workflow_migrations(version) VALUES (5)').run();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private putWorkLog(log: any) {
    this.db.prepare(`INSERT INTO workflow_work_logs(worklog_id, employee_id, task_id, start_time, end_time, record_json)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(worklog_id) DO UPDATE SET
      employee_id=excluded.employee_id, task_id=excluded.task_id, start_time=excluded.start_time,
      end_time=excluded.end_time, record_json=excluded.record_json`)
      .run(log.worklog_id, log.emp_id, log.task_id, log.start_time, log.end_time, JSON.stringify(log));
  }

  getWorkLogsForEmployee(employeeId: string) {
    return (this.db.prepare('SELECT record_json FROM workflow_work_logs WHERE employee_id = ? ORDER BY rowid').all(employeeId) as any[])
      .map((row) => JSON.parse(row.record_json));
  }

  getWorkLogs() {
    return (this.db.prepare('SELECT record_json FROM workflow_work_logs ORDER BY rowid').all() as any[])
      .map((row) => JSON.parse(row.record_json));
  }

  createWorkLog(log: any) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const duplicate = this.db.prepare(`SELECT 1 FROM workflow_work_logs
        WHERE employee_id = ? AND task_id = ? AND start_time = ? AND end_time = ? LIMIT 1`)
        .get(log.emp_id, log.task_id, log.start_time, log.end_time);
      if (duplicate) throw new ConflictException('A work log already exists for this task and time range.');
      this.db.prepare('INSERT INTO workflow_work_logs(worklog_id, employee_id, task_id, start_time, end_time, record_json) VALUES (?, ?, ?, ?, ?, ?)')
        .run(log.worklog_id, log.emp_id, log.task_id, log.start_time, log.end_time, JSON.stringify(log));
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  onModuleDestroy() { this.db.close(); }
}

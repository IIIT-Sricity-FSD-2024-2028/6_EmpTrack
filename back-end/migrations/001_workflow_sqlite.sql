-- Applied by WorkflowPersistenceService at startup; issue/escalation data only.
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
CREATE INDEX IF NOT EXISTS workflow_escalations_issue_idx ON workflow_escalations(issue_id);

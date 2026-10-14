import { formatDate } from '../../../utils/saCommon';
import { formatStatus, formatVerification, priorityBadgeClass, statusBadgeClass, verificationBadgeClass } from '../tmConstants';

/** Progress bar used in table cells and in the issue modal. */
export function ProgressBar({ value, style, fillId, pctId }) {
  const pct = value || 0;
  return (
    <div className="progress-row" style={style}>
      <div className="progress-track">
        <div className={`progress-fill ${pct >= 100 ? 'complete' : ''}`} id={fillId} style={{ width: `${pct}%` }}></div>
      </div>
      <span className="progress-pct" id={pctId}>{pct}%</span>
    </div>
  );
}

/**
 * <tbody> rows for an issue list (original _board.js renderIssueRows).
 * status: loading | error | ready; onOpen(issue) opens the detail modal.
 */
export default function IssueRows({ id, issues, status, loadingText, errorText, emptyMessage, onOpen }) {
  let rows;
  if (status === 'loading') {
    rows = <tr className="loader-row"><td colSpan="9"><div className="spinner"></div><div>{loadingText}</div></td></tr>;
  } else if (status === 'error') {
    rows = <tr className="error-row"><td colSpan="9"><i className="ph ph-warning-circle"></i> {errorText}</td></tr>;
  } else if (!issues || issues.length === 0) {
    rows = (
      <tr className="empty-row">
        <td colSpan="9"><i className="ph ph-bug" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>{emptyMessage || 'No issues found.'}</td>
      </tr>
    );
  } else {
    rows = issues.map((t) => (
      <tr key={t.ticket_id} className={t.priority === 'Critical' && !['RESOLVED', 'CLOSED'].includes(t.status) ? 'critical-row' : ''}>
        <td>{t.ticket_id}</td>
        <td>{t.company_name}</td>
        <td>
          <div className="cell-primary">
            <span className="cell-name">{t.title}</span>
            <span className="cell-sub">{t.category}</span>
          </div>
        </td>
        <td><span className={`badge ${priorityBadgeClass(t.priority)}`}>{t.priority}</span></td>
        <td><span className={`badge ${statusBadgeClass(t.status)}`}>{formatStatus(t.status)}</span></td>
        <td><ProgressBar value={t.progress_percentage} style={{ minWidth: 110 }} /></td>
        <td>
          {t.verification_status ? (
            <span className={`badge ${verificationBadgeClass(t.verification_status)}`}>{formatVerification(t.verification_status)}</span>
          ) : (
            '-'
          )}
        </td>
        <td>{formatDate(t.updated_date)}</td>
        <td>
          <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="icon-btn" title="View / Manage" onClick={() => onOpen(t)}><i className="ph ph-eye"></i></button>
          </div>
        </td>
      </tr>
    ));
  }
  return <tbody id={id}>{rows}</tbody>;
}

/** Column headers shared by every issue table. */
export function IssueTableHead() {
  return (
    <thead>
      <tr>
        <th>Issue ID</th><th>Company</th><th>Title</th><th>Priority</th><th>Status</th><th>Progress</th><th>Verification</th><th>Updated</th><th style={{ textAlign: 'right' }}>Actions</th>
      </tr>
    </thead>
  );
}

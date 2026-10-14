// Ticket table from front-end/js/views/support_member/_board.js (renderTicketRows),
// shared by the Dashboard, My Tickets and Escalated pages.
import { formatDate, formatStatus, isClosedStatus, priorityBadge, supportTicketBadge } from '../../../components/platform/format';
import { ShellTable } from '../../../components/platform/ShellUI';

/**
 * onView(ticket) opens the detail modal; onClaim(ticket) quick-claims an
 * unassigned ticket straight from its row (the modal has the same action).
 */
export default function SupportTicketTable({ tickets, loading, error, loadingText = 'Loading...', emptyMessage = 'No tickets found.', onView, onClaim, claimingId }) {
  const columns = [
    { key: 'ticket_id', header: 'Ticket ID' },
    { key: 'company_name', header: 'Company' },
    { key: 'subject', header: 'Subject', render: (t) => <div className="cell-primary"><span className="cell-name">{t.title}</span><span className="cell-sub">{t.raised_by_name}</span></div> },
    { key: 'category', header: 'Category' },
    { key: 'priority', header: 'Priority', render: (t) => <span className={`badge ${priorityBadge(t.priority)}`}>{t.priority}</span> },
    { key: 'status', header: 'Status', render: (t) => <span className={`badge ${supportTicketBadge(t.status)}`}>{formatStatus(t.status)}</span> },
    { key: 'assigned', header: 'Assigned To', render: (t) => t.assigned_to_name || 'Unassigned' },
    { key: 'created', header: 'Created', render: (t) => formatDate(t.created_date) },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (t) => (
        <div className="row-actions">
          <button type="button" className="icon-btn" title="View" aria-label={`View ${t.ticket_id}`} onClick={() => onView(t)}><i className="ph ph-eye"></i></button>
          {!t.assigned_to && (
            <button type="button" className="icon-btn" title="Claim" aria-label={`Claim ${t.ticket_id}`} onClick={() => onClaim(t)} disabled={claimingId === t.ticket_id}>
              <i className="ph ph-hand-pointing"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ShellTable
      columns={columns}
      rows={tickets}
      rowKey="ticket_id"
      loading={loading}
      error={error}
      loadingText={loadingText}
      emptyIcon="ph-ticket"
      emptyText={emptyMessage}
      rowClassName={(t) => (t.priority === 'Critical' && !isClosedStatus(t.status) ? 'critical-row' : undefined)}
    />
  );
}

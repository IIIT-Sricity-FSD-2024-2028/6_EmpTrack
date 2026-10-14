// Converted from front-end/support_member/escalated.html + js/views/support_member/escalated.js
import { useState } from 'react';
import { paginate } from '../../components/platform/format';
import { Pagination, PortalShell, SectionHeader } from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { cx } from '../../utils/helpers';
import { getTickets, IS_DEMO } from '../../services/supportMemberService';
import SupportTicketTable from './components/SupportTicketTable';
import useSupportBoard from './components/useSupportBoard';

const PAGE_SIZE = 10;
const SCOPES = [
  { key: 'all', label: 'All Escalated' },
  // Same query as the original: escalated tickets owned by me (assignedTo=me).
  { key: 'mine', label: 'Escalated by Me' },
];

export default function Escalated() {
  const [scope, setScope] = useState('all');
  const [page, setPage] = useState(1);
  const { data: tickets, loading, error, reload } = useFetch(
    () => getTickets({ escalatedOnly: true, assignedTo: scope === 'mine' ? 'me' : undefined }),
    [scope],
  );
  const board = useSupportBoard(reload);
  const pager = paginate(tickets ?? [], page, PAGE_SIZE);

  return (
    <PortalShell portal="sm" title="Escalated Tickets" demo={IS_DEMO}>
      <SectionHeader title="Tickets Escalated to Technical Team or Platform Admin" />

      <div className="card filter-bar">
        <div className="chip-tabs" role="tablist">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={scope === s.key}
              className={cx('chip-tab', scope === s.key && 'active')}
              onClick={() => {
                setScope(s.key);
                setPage(1);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-container">
        <SupportTicketTable
          tickets={tickets ? pager.pageItems : null}
          loading={loading}
          error={error && 'Failed to load escalated tickets.'}
          loadingText="Loading escalated tickets..."
          emptyMessage="No escalated tickets right now."
          onView={board.open}
          onClaim={board.claim}
          claimingId={board.claimingId}
        />
        {tickets && <Pagination {...pager} onChange={setPage} />}
      </div>
      {board.element}
    </PortalShell>
  );
}

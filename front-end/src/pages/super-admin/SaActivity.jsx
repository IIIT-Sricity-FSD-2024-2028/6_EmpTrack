// Converted from front-end/super_admin/activity.html + js/views/super_admin/activity.js
import { useEffect, useState } from 'react';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import SaPagination from '../../components/sa-common/SaPagination';
import { StateRow } from '../../components/sa-common/saForm';
import * as sa from '../../services/superAdminService';
import { formatDateTime, paginate } from '../../utils/saCommon';
import { SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/activity.css';

const PAGE_SIZE = 12;
const COLS = 5;

function statusBadgeClass(status) {
  if (status === 'SUCCESS') return 'badge-active';
  if (status === 'WARNING') return 'badge-pending';
  return 'badge-suspended';
}

export default function SaActivity() {
  const [admins, setAdmins] = useState([]);
  const [actions, setActions] = useState([]);
  const [filters, setFilters] = useState({ userId: '', action: '' });
  const [logs, setLogs] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [page, setPage] = useState(1);

  useEffect(() => {
    sa.getPlatformAdmins().then(setAdmins).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    sa.getActivityLogs(filters)
      .then((list) => {
        if (cancelled) return;
        setLogs(list);
        setLoadState('ready');
        // The action list is built once, from the first (unfiltered) load.
        setActions((prev) => (prev.length ? prev : [...new Set(list.map((l) => l.action))].sort()));
      })
      .catch(() => !cancelled && setLoadState('error'));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };

  const { pageItems, page: safePage, totalPages, total } = paginate(logs, page, PAGE_SIZE);

  let rows;
  if (loadState === 'loading') rows = <StateRow colSpan={COLS} kind="loading">Loading activity...</StateRow>;
  else if (loadState === 'error') rows = <StateRow colSpan={COLS} kind="error">Failed to load activity.</StateRow>;
  else if (logs.length === 0) rows = <StateRow colSpan={COLS} kind="empty" icon="ph-list-magnifying-glass">No activity recorded yet.</StateRow>;
  else {
    rows = pageItems.map((l, i) => (
      <tr key={l.log_id || l.id || `${l.timestamp}-${i}`}>
        <td><div className="cell-primary"><span className="cell-name">{l.user_name}</span><span className="cell-sub">{l.role}</span></div></td>
        <td><div className="cell-primary"><span>{l.action}</span><span className="cell-sub details">{l.details || ''}</span></div></td>
        <td>{l.company_name || '-'}</td>
        <td>{formatDateTime(l.timestamp)}</td>
        <td><span className={`badge ${statusBadgeClass(l.status)}`}>{l.status}</span></td>
      </tr>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Activity" title="Activity" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="card filter-bar">
          <div className="filters-wrap">
            <select id="user-filter" className="filter-select" aria-label="Filter by user" value={filters.userId} onChange={setFilter('userId')}>
              <option value="">All Users</option>
              {admins.map((a) => <option key={a.emp_id} value={a.emp_id}>{a.emp_name}</option>)}
            </select>
            <select id="action-filter" className="filter-select" aria-label="Filter by action" value={filters.action} onChange={setFilter('action')}>
              <option value="">All Actions</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" className="btn-clear" id="btn-clear-filters" onClick={() => { setPage(1); setFilters({ userId: '', action: '' }); }}><i className="ph ph-x"></i> Clear</button>
          </div>
        </div>

        <div className="card table-container">
          <table>
            <thead>
              <tr><th>User</th><th>Action</th><th>Company</th><th>Date / Time</th><th>Status</th></tr>
            </thead>
            <tbody id="activity-tbody">{rows}</tbody>
          </table>
          {loadState === 'ready' && logs.length > 0 ? (
            <SaPagination id="activity-pagination" page={safePage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          ) : (
            <div className="pagination" id="activity-pagination"></div>
          )}
        </div>
      </div>
    </>
  );
}

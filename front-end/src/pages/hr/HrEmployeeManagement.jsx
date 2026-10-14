// Converted from front-end/hr/employee-management.html + js/views/hr/employee-management.js.
// The original listed hard-coded demo employees and "added" new ones only in memory;
// this is the real company directory. Creating accounts is a Company Admin action
// in the backend (POST /employees), so HR gets a read-only view here.
import { useEffect, useState } from 'react';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import SaModal from '../../components/sa-common/SaModal';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import * as hr from '../../services/hrService';
import { ROLE_NAMES, departmentsOf, isOnLeave, joinedThisMonth, nameOf, shortDate, todayKey } from './hrUtils';
import './styles/employee-management.css';

const STATUS = {
  Active: { cls: 'active', tip: 'Currently working' },
  Inactive: { cls: 'inactive', tip: 'No longer active' },
  'On Leave': { cls: 'leave', tip: 'Currently on approved leave' },
};

export default function HrEmployeeManagement() {
  usePageTitle('Employee Management');
  const { user } = useAuth();
  const [employees, setEmployees] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({ search: '', dept: 'all', status: 'all' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([hr.getEmployees(), hr.getLeaves().catch(() => [])])
      .then(([list, leaveList]) => {
        setEmployees(list.filter((e) => e.emp_id !== user.emp_id));
        setLeaves(leaveList);
      })
      .catch(() => setError(true));
  }, [user.emp_id]);

  const today = todayKey();
  const statusOf = (e) => {
    if (e.status !== 'ACTIVE') return 'Inactive';
    return isOnLeave(leaves, e.emp_id, today) ? 'On Leave' : 'Active';
  };

  const all = employees || [];
  const term = filters.search.toLowerCase();
  const visible = all.filter((e) =>
    (!term || e.emp_name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term) || e.emp_id.toLowerCase().includes(term))
    && (filters.dept === 'all' || e.department_id === filters.dept)
    && (filters.status === 'all' || statusOf(e) === filters.status));
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  let rows;
  if (error) rows = <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--emp-danger, #EF4444)' }}>Failed to load employees.</td></tr>;
  else if (!employees) rows = <tr className="loader-row"><td colSpan={6}><div className="spinner"></div><div>Loading directory...</div></td></tr>;
  else if (visible.length === 0) rows = <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees found matching your criteria.</td></tr>;
  else {
    rows = visible.map((e) => {
      const status = statusOf(e);
      return (
        <tr key={e.emp_id}>
          <td><button type="button" className="emp-id-link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }} onClick={() => setSelected(e)}>{e.emp_id}</button></td>
          <td><div className="emp-name-col"><span className="emp-name">{e.emp_name}</span><span className="emp-email">{e.email}</span></div></td>
          <td>{e.department_id || '-'}</td>
          <td>{ROLE_NAMES[e.role] || e.role}</td>
          <td>{e.date_of_joining || '-'}</td>
          <td><span className={`badge ${STATUS[status].cls}`} data-tooltip={STATUS[status].tip}>{status}</span></td>
        </tr>
      );
    });
  }

  return (
    <div className="hr-emp-manage">
      <div className="card filter-bar">
        <div className="search-wrap">
          <i className="ph ph-magnifying-glass"></i>
          <input type="text" id="empSearch" className="search-input" placeholder="Search employees by name, email, or ID..." aria-label="Search employees" value={filters.search} onChange={set('search')} />
        </div>
        <div className="filters-wrap">
          <select id="empDeptFilter" className="filter-select" aria-label="Filter by department" value={filters.dept} onChange={set('dept')}>
            <option value="all">All Departments</option>
            {departmentsOf(all).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select id="empStatusFilter" className="filter-select" aria-label="Filter by status" value={filters.status} onChange={set('status')}>
            <option value="all">All Status</option>
            {Object.keys(STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="btn-clear" id="empClearSort" onClick={() => setFilters({ search: '', dept: 'all', status: 'all' })}><i className="ph ph-x"></i> Clear</button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr><th>Employee ID</th><th>Employee</th><th>Department</th><th>Role</th><th>Join Date</th><th>Status</th></tr>
          </thead>
          <tbody id="empTableBody">{rows}</tbody>
        </table>
      </div>

      <div className="summary-grid">
        <div className="card summary-card sc-total"><div className="sc-val"><AnimatedCount value={all.length} /></div><div className="sc-label">Total Employees</div></div>
        <div className="card summary-card sc-active"><div className="sc-val"><AnimatedCount value={all.filter((e) => statusOf(e) === 'Active').length} /></div><div className="sc-label">Active</div></div>
        <div className="card summary-card sc-leave"><div className="sc-val"><AnimatedCount value={all.filter((e) => statusOf(e) === 'On Leave').length} /></div><div className="sc-label">On Leave</div></div>
        <div className="card summary-card sc-new"><div className="sc-val"><AnimatedCount value={all.filter((e) => joinedThisMonth(e)).length} /></div><div className="sc-label">New This Month</div></div>
      </div>

      <SaModal id="empDetailModal" open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `${selected.emp_name} (${selected.emp_id})` : 'Employee'}>
        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
            {[
              ['Email', selected.email],
              ['Phone', selected.phone || '-'],
              ['Role', ROLE_NAMES[selected.role] || selected.role],
              ['Status', statusOf(selected)],
              ['Department', selected.department_id || '-'],
              ['Team', selected.team_id || '-'],
              ['Manager', selected.manager_id ? nameOf(all, selected.manager_id) : '-'],
              ['Joined', shortDate(selected.date_of_joining)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </SaModal>
    </div>
  );
}

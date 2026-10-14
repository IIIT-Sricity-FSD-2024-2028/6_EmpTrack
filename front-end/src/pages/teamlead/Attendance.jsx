import { useState } from 'react';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, Person, StatCard, useTeamData } from './components/TeamLeadUI';
import { matchesSearch, todayKey } from './tlUtils';
import './teamlead.css';

const STATUS = {
  OFFICE: { label: 'In Office', badge: 'present' },
  REMOTE: { label: 'Remote', badge: 'info' },
  LEAVE: { label: 'On Leave', badge: 'vacation' },
  ABSENT: { label: 'Absent', badge: 'danger' },
};

export default function Attendance() {
  usePageTitle('Team Attendance');
  const { data, error, reload } = useTeamData({ tasks: false, attendance: true, leaves: true });
  const [date, setDate] = useState(todayKey());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const leaves = data?.leaves ?? [];
  const rows = (data?.members ?? []).map((m) => {
    const record = (data?.attendance ?? []).find((a) => a.emp_id === m.emp_id && a.attendance_date === date);
    const onLeave = leaves.some((l) => l.emp_id === m.emp_id && l.status === 'APPROVED' && l.start_date <= date && date <= l.end_date);
    let status = 'ABSENT';
    // Demo data uses `mode`; the backend stores `attendance_mode`.
    if (record?.status === 'PRESENT') status = (record.mode ?? record.attendance_mode) === 'REMOTE' ? 'REMOTE' : 'OFFICE';
    else if (onLeave) status = 'LEAVE';
    return { ...m, status, checkIn: record?.check_in_time, checkOut: record?.check_out_time };
  });
  const count = (s) => rows.filter((r) => r.status === s).length;
  const visible = rows.filter((r) => (!statusFilter || r.status === statusFilter) && matchesSearch(search, r.emp_id, r.emp_name));
  const isToday = date === todayKey();

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="tl-section-title" style={{ margin: 0 }}>{isToday ? "Today's" : formatDate(date)} Office Presence</h3>
            <span className="tl-muted">{count('OFFICE') + count('REMOTE')} of {rows.length} team members working</span>
          </div>
          <input type="date" className="form-control" style={{ width: 'auto' }} aria-label="Attendance date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} />
        </div>

        <div className="tl-stats-grid">
          <StatCard icon="ph-buildings" tone="green" label="In Office" value={count('OFFICE')} />
          <StatCard icon="ph-house-line" label="Remote" value={count('REMOTE')} />
          <StatCard icon="ph-airplane-tilt" tone="orange" label="On Leave" value={count('LEAVE')} />
          <StatCard icon="ph-user-minus" tone="red" label="Absent" value={count('ABSENT')} />
        </div>

        <div className="card table-modern" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-card-header"><h3>Employee Attendance</h3></div>
          <div className="tl-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by employee name or ID" />
            <select className="form-control" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {Object.entries(STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </select>
          </div>
          <Table
            rowKey="emp_id"
            data={visible}
            emptyMessage="No attendance records match."
            columns={[
              { key: 'emp_id', header: 'Employee ID', render: (r) => <span className="tl-muted">{r.emp_id}</span> },
              { key: 'emp_name', header: 'Employee Name', render: (r) => <Person name={r.emp_name} /> },
              { key: 'checkIn', header: 'Check-In', render: (r) => r.checkIn || '--' },
              { key: 'checkOut', header: 'Check-Out', render: (r) => r.checkOut || (r.checkIn && isToday ? 'Still working' : '--') },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status].badge}>{STATUS[r.status].label}</Badge> },
            ]}
          />
        </div>
      </LoadState>
    </div>
  );
}

// Converted from front-end/platform_admin/workload.html + js/views/platform_admin/workload.js
import { accountStatusBadge } from '../../components/platform/format';
import { PortalShell, SectionHeader, ShellTable } from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { getTeamWorkload, IS_DEMO } from '../../services/platformAdminService';

const COLUMNS = [
  { key: 'member', header: 'Member', render: (m) => <div className="cell-primary"><span className="cell-name">{m.emp_name}</span><span className="cell-sub">{m.specialization || ''}</span></div> },
  { key: 'status', header: 'Status', render: (m) => <span className={`badge ${accountStatusBadge(m.status)}`}>{m.status}</span> },
  { key: 'open_tickets', header: 'Open' },
  { key: 'in_progress_tickets', header: 'In Progress' },
  { key: 'total_assigned', header: 'Total' },
];

function WorkloadTable({ title, icon, members, loading, error }) {
  return (
    <div className="card table-container">
      <SectionHeader title={title} icon={icon} style={{ padding: '16px 20px' }} />
      <ShellTable
        columns={COLUMNS}
        rows={members}
        rowKey="emp_id"
        loading={loading}
        error={error && 'Failed to load workload.'}
        loadingText="Loading workload..."
        emptyIcon={icon}
        emptyText="No team members found."
      />
    </div>
  );
}

export default function Workload() {
  const { data, loading, error } = useFetch(getTeamWorkload, []);
  return (
    <PortalShell portal="pa" title="Team Workload" demo={IS_DEMO}>
      <WorkloadTable title="Technical Team Workload" icon="ph-hard-drives" members={data?.technical} loading={loading} error={error} />
      <WorkloadTable title="Support Team Workload" icon="ph-headset" members={data?.support} loading={loading} error={error} />
    </PortalShell>
  );
}

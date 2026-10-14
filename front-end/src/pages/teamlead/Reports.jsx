import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getReports, saveReport } from '../../services/teamLeadService';
import { formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, StatCard, useTeamData, useToast } from './components/TeamLeadUI';
import { buildPerformance, nameOf, taskStatusLabel, teamIssues, toCsv, todayKey } from './tlUtils';
import './teamlead.css';

const TYPES = ['Team Performance', 'Task Summary', 'Attendance Log', 'Issue Resolution'];
const RANGES = { last7: 'Last 7 days', last30: 'Last 30 days', thisMonth: 'This month', lastQuarter: 'Last 90 days' };
const FORMATS = { pdf: 'PDF (print / save as PDF)', csv: 'Excel / CSV (.csv)', json: 'Raw data (.json)' };

function rangeStart(range) {
  const d = new Date();
  if (range === 'thisMonth') return `${todayKey().slice(0, 7)}-01`;
  d.setDate(d.getDate() - ({ last7: 7, last30: 30, lastQuarter: 90 }[range] ?? 30));
  return d.toISOString().split('T')[0];
}

/** Rows for a report type, limited to records dated inside the range. */
function buildRows(type, range, data) {
  const from = rangeStart(range);
  const inRange = (date) => Boolean(date) && date >= from;
  const members = data.members;
  const tasks = data.tasks.filter((t) => inRange(t.completed_at || t.created_at) || t.status !== 'COMPLETED');

  if (type === 'Team Performance') {
    return buildPerformance(members, tasks, data.attendance.filter((a) => inRange(a.attendance_date))).map((p) => ({
      Employee: p.name, 'Tasks Assigned': p.total, Completed: p.completed, 'Productivity %': p.productivity, 'Attendance %': p.attendance ?? '', Status: p.band,
    }));
  }
  if (type === 'Task Summary') {
    return tasks.map((t) => ({
      'Task ID': t.task_id, Title: t.task_title, Employee: nameOf(members, t.assigned_to), Status: taskStatusLabel(t.status),
      'Progress %': t.progress_percentage ?? 0, 'Est. Hours': t.est_hours ?? '', 'Hours Worked': t.hours_worked ?? 0, Deadline: t.deadline ?? '',
    }));
  }
  if (type === 'Attendance Log') {
    return data.attendance.filter((a) => inRange(a.attendance_date)).map((a) => ({
      Date: a.attendance_date, Employee: nameOf(members, a.emp_id), Status: a.status, 'Check-In': a.check_in_time ?? '', 'Check-Out': a.check_out_time ?? '',
    }));
  }
  return teamIssues(members, data.issues).filter((i) => inRange(i.raised_date) || i.status !== 'Resolved').map((i) => ({
    'Issue ID': i.issue_id, Title: i.title, Employee: nameOf(members, i.emp_id), Priority: i.priority, Status: i.status,
    Raised: i.raised_date ?? '', Resolved: i.resolved_date ?? '', 'Assigned To': i.assigned_to ?? '',
  }));
}

function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Opens a printable page; the browser's print dialog saves it as PDF. */
function printReport(title, rows, win) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  win.document.write(`<!doctype html><title>${escapeHtml(title)}</title>
    <style>body{font-family:Inter,Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%;font-size:12px}
    th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f3f4f6}</style>
    <h2>${escapeHtml(title)}</h2><p>Generated ${new Date().toLocaleString()}</p>
    <table><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
    ${rows.map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h])}</td>`).join('')}</tr>`).join('')}</table>`);
  win.document.close();
  win.print();
}

export default function Reports() {
  usePageTitle('Reports');
  const { data, error, reload } = useTeamData({ attendance: true, issues: true });
  const { data: reports = [], reload: reloadReports } = useFetch(getReports, []);
  const [form, setForm] = useState({ type: TYPES[0], range: 'last7', format: 'pdf' });
  const [toast, showToast] = useToast();

  const tasks = data?.tasks ?? [];
  const completed = tasks.filter((t) => t.status === 'COMPLETED');
  const productivity = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const avgTime = completed.length ? Math.round(completed.reduce((s, t) => s + Number(t.hours_worked || 0), 0) / completed.length) : 0;

  const generate = ({ type, range, format }) => {
    const rows = buildRows(type, range, data);
    if (rows.length === 0) {
      showToast('No records in that date range.', 'error');
      return null;
    }
    const title = `${type} - ${RANGES[range]}`;
    const base = `${type.replace(/\s+/g, '_')}_${todayKey()}`;
    if (format === 'pdf') {
      const win = window.open('', '_blank');
      if (!win) {
        showToast('Allow pop-ups to print the PDF report.', 'error');
        return null;
      }
      printReport(title, rows, win);
      return rows.length;
    }
    const text = format === 'csv' ? toCsv(rows) : JSON.stringify(rows, null, 2);
    download(`${base}.${format}`, text, format === 'csv' ? 'text/csv' : 'application/json');
    return new Blob([text]).size;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const result = generate(form);
    if (result === null) return;
    await saveReport({ ...form, title: `${form.type} - ${RANGES[form.range]}`, size: form.format === 'pdf' ? `${result} rows` : `${(result / 1024).toFixed(1)} KB` });
    reloadReports();
    showToast(`${form.type} report generated`);
  };

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-briefcase" label="Total Tasks Assigned" value={tasks.length} />
          <StatCard icon="ph-check-circle" tone="green" label="Tasks Completed" value={completed.length} />
          <StatCard icon="ph-chart-line-up" tone="orange" label="Team Productivity" value={`${productivity}%`} />
          <StatCard icon="ph-timer" label="Avg. Task Time" value={`${avgTime}h`} />
        </div>

        <form className="card" onSubmit={handleGenerate}>
          <h3 className="tl-section-title">Generate Custom Report</h3>
          <div className="tl-form-grid">
            <Input as="select" label="Report Type" value={form.type} onChange={set('type')}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </Input>
            <Input as="select" label="Date Range" value={form.range} onChange={set('range')}>
              {Object.entries(RANGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Input>
            <Input as="select" label="Format" value={form.format} onChange={set('format')}>
              {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Input>
          </div>
          <Button type="submit" variant="purple" icon="ph-file-text">Generate Report</Button>
          <p className="tl-muted" style={{ marginBottom: 0 }}>Reports are built in your browser from the current team data; the history below is saved in this browser and Download rebuilds a report from the latest data.</p>
        </form>

        <Table
          title="Recent Reports"
          data={reports}
          emptyMessage="No reports generated yet."
          columns={[
            { key: 'id', header: 'Report ID', render: (r) => <span className="tl-id">{r.id}</span> },
            { key: 'title', header: 'Title', render: (r) => <><i className="ph-fill ph-file-text" style={{ color: 'var(--primary-color)' }}></i> {r.title}</> },
            { key: 'format', header: 'Format', render: (r) => <Badge variant="info">{r.format.toUpperCase()}</Badge> },
            { key: 'date', header: 'Generated', render: (r) => formatDate(r.date) },
            { key: 'size', header: 'Size' },
            { key: 'actions', header: 'Actions', render: (r) => (
              <Button variant="outline" icon="ph-download-simple" className="tl-btn-sm" onClick={() => generate(r)}>Download</Button>
            ) },
          ]}
        />
      </LoadState>
      {toast}
    </div>
  );
}

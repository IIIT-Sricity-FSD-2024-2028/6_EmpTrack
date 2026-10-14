// Small building blocks shared by the Team Lead pages. Styles: ../teamlead.css
// plus the original .tl-* classes in styles/views.css.
import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import { ROLES } from '../../../utils/constants';
import { cx, getInitials } from '../../../utils/helpers';
import { getRoleBasePath } from '../../../utils/permissions';
import useAuth from '../../../hooks/useAuth';
import useFetch from '../../../hooks/useFetch';
import {
  getIssues,
  getTeamAttendance,
  getTeamLeaves,
  getTeamMembers,
  getTeamTasks,
  IS_DEMO,
} from '../../../services/teamLeadService';

/** Absolute URL of a team lead page: tlPath('tasks') -> /teamlead/tasks */
export const tlPath = (page) => `${getRoleBasePath(ROLES.TEAM_LEAD)}/${page}`;

/**
 * Loads the team and the collections a page asks for.
 * const { data, loading, error, reload } = useTeamData({ attendance: true });
 * data: { members, tasks, attendance, leaves, issues } (unrequested ones are [])
 */
export function useTeamData({ tasks = true, attendance = false, leaves = false, issues = false } = {}) {
  const { user } = useAuth();
  return useFetch(async () => {
    const members = await getTeamMembers();
    const [t, a, l, i] = await Promise.all([
      tasks ? getTeamTasks(user.emp_id) : [],
      attendance ? getTeamAttendance(members) : [],
      leaves ? getTeamLeaves(members.map((m) => m.emp_id)) : [],
      issues ? getIssues() : [],
    ]);
    return { members, tasks: t, attendance: a, leaves: l, issues: i };
  }, [user.emp_id, tasks, attendance, leaves, issues]);
}

/** tone: blue | orange | red | green (the original .icon-* classes) */
export function StatCard({ icon, tone = 'blue', label, value }) {
  return (
    <div className="tl-stat-card">
      <div className={`tl-stat-icon icon-${tone}`}>
        <i className={`ph-fill ${icon}`}></i>
      </div>
      <div className="tl-stat-info">
        <span className="tl-stat-value">{value}</span>
        <span className="tl-stat-label">{label}</span>
      </div>
    </div>
  );
}

export function Person({ name, sub }) {
  return (
    <div className="tl-person">
      <span className="tl-avatar" aria-hidden="true">{getInitials(name)}</span>
      <div>
        <div className="tl-person-name">{name}</div>
        {sub && <div className="tl-muted">{sub}</div>}
      </div>
    </div>
  );
}

/** Progress bar coloured like the original work-monitoring page (>=75 green, >=50 orange, else red). */
export function Progress({ value = 0 }) {
  const tone = value >= 75 ? 'green' : value >= 50 ? 'orange' : 'red';
  return (
    <div className="tl-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="tl-progress-bar-bg">
        <div className={`tl-progress-bar-fill fill-${tone}`} style={{ width: `${Math.min(value, 100)}%` }}></div>
      </div>
      <span className={`tl-progress-value text-${tone}`}>{value}%</span>
    </div>
  );
}

/** tabs: [{ key, label }] */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tl-tabs" role="tablist">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          className={cx('tl-tab', active === key && 'active')}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Loading / error wrapper for useFetch results. */
export function LoadState({ loading, error, onRetry, children }) {
  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon="ph-warning-circle"
          title="Could not load data"
          description={error.message}
          action={onRetry && <Button variant="outline" icon="ph-arrow-clockwise" onClick={onRetry}>Retry</Button>}
        />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="tl-loading" role="status">
        <i className="ph ph-spinner-gap tl-spin"></i> Loading...
      </div>
    );
  }
  return children;
}

/** Tells the user the portal is running on demo data (no VITE_API_URL). */
export function DemoNotice() {
  if (!IS_DEMO) return null;
  return (
    <div className="tl-demo-notice">
      <i className="ph ph-info"></i> Demo mode: no backend is configured (VITE_API_URL), so changes are saved in this browser only.
    </div>
  );
}

/** const [toast, showToast] = useToast(); showToast('Saved'); render {toast} */
export function useToast() {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(() => setCurrent(null), 3000);
    return () => clearTimeout(timer);
  }, [current]);

  const show = useCallback((message, type = 'success') => setCurrent({ message, type, id: Date.now() }), []);

  const toast = current && (
    <div key={current.id} className={`tl-toast tl-toast-${current.type}`} role="status">
      <i className={`ph-fill ${current.type === 'error' ? 'ph-warning-circle' : 'ph-check-circle'}`}></i> {current.message}
    </div>
  );
  return [toast, show];
}

// ---- charts (inline SVG, no chart library) ----
const W = 600;
const H = 240;
const PAD = { top: 16, right: 24, bottom: 28, left: 36 };

/** Axis max split into 4 equal whole-number steps (1, 2, 5 or 10 x a power of ten). */
function niceMax(max) {
  const raw = Math.max(1, max / 4);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= raw);
  return Math.max(4, Math.ceil(step) * 4);
}

function Grid({ yMax }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => yMax * f);
  const y = (v) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / yMax);
  return ticks.map((t) => (
    <g key={t}>
      <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="tl-chart-grid" />
      <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="tl-chart-axis">{t}</text>
    </g>
  ));
}

/** series: [{ name, values: number[], color }] sharing one y-axis. */
export function LineChart({ labels, series, label }) {
  const yMax = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const innerW = W - PAD.left - PAD.right;
  const x = (i) => PAD.left + (labels.length > 1 ? (innerW * i) / (labels.length - 1) : innerW / 2);
  const y = (v) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / yMax);

  return (
    <figure className="tl-chart">
      <div className="tl-legend">
        {series.map((s) => (
          <span key={s.name}><i style={{ background: s.color }}></i>{s.name}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <Grid yMax={yMax} />
        {labels.map((l, i) => (
          <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" className="tl-chart-axis">{l}</text>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" strokeWidth="2" style={{ stroke: s.color }} />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="4" style={{ fill: s.color }} className="tl-chart-dot">
                <title>{`${labels[i]} - ${s.name}: ${v}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
    </figure>
  );
}

/** data: [{ label, value }] */
export function BarChart({ data, color, label }) {
  const yMax = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const slot = (W - PAD.left - PAD.right) / data.length;
  const barW = Math.min(56, slot * 0.5);
  const base = H - PAD.bottom;
  const h = (v) => (H - PAD.top - PAD.bottom) * (v / yMax);

  return (
    <figure className="tl-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <Grid yMax={yMax} />
        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const top = base - h(d.value);
          const r = Math.min(4, h(d.value));
          const left = cx - barW / 2;
          return (
            <g key={d.label}>
              {d.value > 0 && (
                <path
                  d={`M${left},${base} V${top + r} Q${left},${top} ${left + r},${top} H${left + barW - r} Q${left + barW},${top} ${left + barW},${top + r} V${base} Z`}
                  style={{ fill: color }}
                >
                  <title>{`${d.label}: ${d.value}`}</title>
                </path>
              )}
              <text x={cx} y={top - 6} textAnchor="middle" className="tl-chart-value">{d.value}</text>
              <text x={cx} y={H - 8} textAnchor="middle" className="tl-chart-axis">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

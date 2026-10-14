// Small presentational pieces shared by the Platform Admin and Support Member
// pages, using the original pa-/sm-shell markup (see platform.css).
import { useCallback, useEffect, useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { cx } from '../../utils/helpers';
import './platform.css';

/**
 * Page wrapper: sets the header title and renders the portal root.
 * portal: 'pa' (Platform Admin) | 'sm' (Support Member)
 * demo:   true to show the "no backend configured" notice
 */
export function PortalShell({ portal, title, demo, children }) {
  usePageTitle(title);
  return (
    <div className={cx('ops-shell', `${portal}-shell`)}>
      {demo && (
        <div className="ops-demo-notice" role="note">
          <i className="ph ph-info"></i>
          Demo mode: no backend is configured (VITE_API_URL), so changes are saved in this browser only.
        </div>
      )}
      {children}
    </div>
  );
}

/** Scope classes for modals of a portal (they render outside the page root). */
export const modalClass = (portal) => `ops-modal ${portal}-modal`;

export function SectionHeader({ title, icon, action, style }) {
  return (
    <div className="section-header" style={style}>
      <h2 className="section-title">
        {icon && <i className={`ph ${icon}`}></i>}
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Animates 0 -> target like sa-common animateCount (700ms). */
function useCountUp(target) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const step = (time) => {
      const progress = Math.min((time - start) / 700, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

/** tone: primary | success | warning | danger | info | purple. format: optional (n) => string */
export function StatCard({ icon, tone, label, value = 0, format, onClick }) {
  const animated = useCountUp(Number(value) || 0);
  const content = (
    <>
      <div className={cx('stat-icon', tone)}><i className={`ph-fill ${icon}`}></i></div>
      <div>
        <div className="stat-value">{format ? format(value) : animated.toLocaleString()}</div>
        <div className="stat-label">{label}</div>
      </div>
    </>
  );
  return onClick ? (
    <button type="button" className="card stat-card clickable" onClick={onClick}>{content}</button>
  ) : (
    <div className="card stat-card">{content}</div>
  );
}

export function ErrorState({ message, style }) {
  return (
    <div className="ops-error" style={style} role="alert">
      <i className="ph ph-warning-circle"></i> {message}
    </div>
  );
}

export function EmptyNote({ icon, message, compact }) {
  return (
    <div className={cx('ops-empty', compact && 'compact')}>
      <i className={`ph ${icon}`}></i> {message}
    </div>
  );
}

export function DetailItem({ label, children, full }) {
  return (
    <div className={cx('detail-item', full && 'full')}>
      <span className="detail-label">{label}</span>
      {typeof children === 'string' || typeof children === 'number' ? <span className="detail-value">{children}</span> : children}
    </div>
  );
}

// ---- filters ----
export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="search-wrap">
      <i className="ph ph-magnifying-glass"></i>
      <input type="text" className="search-input" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** options: [{ value, label }] */
export function FilterSelect({ value, onChange, options, label }) {
  return (
    <select className="filter-select" value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ClearButton({ onClick }) {
  return (
    <button type="button" className="btn-clear" onClick={onClick}>
      <i className="ph ph-x"></i> Clear
    </button>
  );
}

/** Debounced copy of a value (the original debounced search inputs by 350ms). */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---- table ----
/**
 * Table in the original markup with loader / empty / error rows.
 * columns: [{ key, header, render?: (row) => node, align?: 'right' }]
 */
export function ShellTable({ columns, rows, rowKey, loading, error, loadingText, emptyIcon, emptyText, rowClassName }) {
  const span = columns.length;
  let body;
  if (loading && !rows) {
    body = <tr className="loader-row"><td colSpan={span}><div className="spinner"></div><div>{loadingText}</div></td></tr>;
  } else if (error) {
    body = <tr className="error-row"><td colSpan={span}><i className="ph ph-warning-circle"></i> {error}</td></tr>;
  } else if (!rows || rows.length === 0) {
    body = <tr className="empty-row"><td colSpan={span}><i className={`ph ${emptyIcon}`}></i>{emptyText}</td></tr>;
  } else {
    body = rows.map((row) => (
      <tr key={row[rowKey]} className={rowClassName?.(row)}>
        {columns.map((c) => (
          <td key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{c.render ? c.render(row) : row[c.key]}</td>
        ))}
      </tr>
    ));
  }
  return (
    <table>
      <thead>
        <tr>{columns.map((c) => <th key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{c.header}</th>)}</tr>
      </thead>
      <tbody>{body}</tbody>
    </table>
  );
}

/** Same controls as sa-common renderPagination. */
export function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (!total) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const items = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      items.push(<button key={p} type="button" className={cx('page-btn', p === page && 'active')} onClick={() => onChange(p)}>{p}</button>);
    } else if (p === page - 2 || p === page + 2) {
      items.push(<span key={p} className="page-gap">&hellip;</span>);
    }
  }
  return (
    <div className="pagination">
      <div className="pagination-info">Showing {start}-{end} of {total}</div>
      <div className="pagination-controls">
        <button type="button" className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><i className="ph ph-caret-left"></i></button>
        {items}
        <button type="button" className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><i className="ph ph-caret-right"></i></button>
      </div>
    </div>
  );
}

// ---- toast ----
/** const [toast, showToast] = useToast(); showToast('Saved'); showToast('Oops', 'error'); render {toast} */
export function useToast() {
  const [current, setCurrent] = useState(null);
  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(() => setCurrent(null), 3500);
    return () => clearTimeout(timer);
  }, [current]);
  const show = useCallback((message, type = 'success') => setCurrent({ message, type, id: Date.now() }), []);
  const toast = current && (
    <div key={current.id} className={cx('ops-toast', current.type)} role="status">{current.message}</div>
  );
  return [toast, show];
}

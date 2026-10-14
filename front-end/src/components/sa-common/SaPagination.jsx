import { cx } from '../../utils/helpers';

/** Same controls as sa-common renderPagination (Showing x-y of n, prev / pages / next). */
export default function SaPagination({ id, page, totalPages, total, pageSize, onPageChange }) {
  if (!total) return <div className="pagination" id={id}></div>;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const go = (target) => target >= 1 && target <= totalPages && onPageChange(target);

  const items = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      items.push(<button key={p} type="button" className={cx('page-btn', p === page && 'active')} onClick={() => go(p)}>{p}</button>);
    } else if (p === page - 2 || p === page + 2) {
      items.push(<span key={p} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>&hellip;</span>);
    }
  }

  return (
    <div className="pagination" id={id}>
      <div className="pagination-info">Showing {start}-{end} of {total}</div>
      <div className="pagination-controls">
        <button type="button" className="page-btn" disabled={page === 1} onClick={() => go(page - 1)} aria-label="Previous page"><i className="ph ph-caret-left"></i></button>
        {items}
        <button type="button" className="page-btn" disabled={page === totalPages} onClick={() => go(page + 1)} aria-label="Next page"><i className="ph ph-caret-right"></i></button>
      </div>
    </div>
  );
}

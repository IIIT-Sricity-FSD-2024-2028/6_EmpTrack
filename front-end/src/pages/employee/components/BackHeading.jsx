import { Link } from 'react-router-dom';

const TITLE_STYLES = {
  // issue-details / raise-issue use a bold <div>; update-task uses an <h2>.
  div: { fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)' },
  h2: { margin: 0, fontSize: 'var(--text-xl)' },
};

/** Back arrow + page heading (update-task, issue-details, raise-issue). */
export default function BackHeading({ to, children, gap = 15, as: Title = 'div' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, marginBottom: 24 }}>
      <Link to={to} style={{ color: 'var(--text-main)', textDecoration: 'none' }} aria-label="Back">
        <i className="ph ph-arrow-left" style={{ fontSize: 20 }}></i>
      </Link>
      <Title style={TITLE_STYLES[Title]}>{children}</Title>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { PATHS } from '../../utils/constants';

/** EmpTrack's shared app mark. `href` supports in-page anchors on the landing page. */
export default function BrandLogo({ className = '', to = PATHS.HOME, href, onClick }) {
  const classes = `brand-logo ${className}`.trim();
  const content = (
    <>
      <span className="brand-logo-badge"><LayoutDashboard aria-hidden="true" /></span>
      <span>EmpTrack</span>
    </>
  );

  return href
    ? <a href={href} className={classes} onClick={onClick} aria-label="EmpTrack home">{content}</a>
    : <Link to={to} className={classes} onClick={onClick} aria-label="EmpTrack home">{content}</Link>;
}

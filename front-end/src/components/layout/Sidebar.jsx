import { Link, useLocation, useNavigate } from 'react-router-dom';
import config from '../../config/config';
import { getNavItems } from '../../config/navigation';
import useAuth from '../../hooks/useAuth';
import { PATHS, ROLE_LABELS } from '../../utils/constants';
import { cx } from '../../utils/helpers';
import { getRoleBasePath } from '../../utils/permissions';

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const basePath = getRoleBasePath(role);

  // Same rule as the original: an item is active when the current URL contains
  // its path (or one of its `match` fragments).
  const isActive = ({ path, match = [] }) => [path, ...match].some((part) => pathname.includes(part));

  const handleLogout = async () => {
    await logout();
    navigate(PATHS.HOME);
  };

  return (
    <>
      <div className={cx('sidebar-overlay', isOpen && 'is-visible')} onClick={onClose} />
      <aside className={cx('sidebar', isOpen && 'is-open')}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="ph-fill ph-check-circle"></i> {config.appName}
          </div>
        </div>

        <nav className="sidebar-nav">
          {getNavItems(role).map((item) => (
            <Link
              key={item.path}
              to={`${basePath}/${item.path}`}
              className={cx('nav-item', isActive(item) && 'active')}
              onClick={onClose}
            >
              <i className={`ph ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer sidebar-footer-user">
          <button type="button" className="nav-item sidebar-logout-btn" onClick={handleLogout}>
            <i className="ph ph-sign-out"></i> Logout
          </button>

          <Link to={`${basePath}/profile`} className="sidebar-profile-link" onClick={onClose}>
            <div className="user-profile sidebar-user-profile">
              <div className="user-avatar sidebar-user-avatar">{user?.emp_name?.charAt(0)}</div>
              <div className="user-info">
                <span className="user-name">{user?.emp_name}</span>
                <span className="user-role">{ROLE_LABELS[role]}</span>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}

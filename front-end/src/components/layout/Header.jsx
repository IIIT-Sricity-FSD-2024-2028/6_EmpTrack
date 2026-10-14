import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Calendar from '../calendar/Calendar';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { calendarFetcherFor, createEvent } from '../../services/calendarService';
import { getNotificationsForUser } from '../../services/notificationService';
import { useStore } from '../../store/store';
import { CALENDAR_ROLES, ROLE_PORTAL_LABELS } from '../../utils/constants';
import { cx } from '../../utils/helpers';
import { getRoleBasePath } from '../../utils/permissions';

function CalendarPopover({ user }) {
  const [open, setOpen] = useState(false);
  // Mount the calendar on first open, then keep it (like the original lazy mount).
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef(null);
  const [fetchEvents] = useState(() => calendarFetcherFor(user));
  const [addEvent] = useState(() => (dto) => createEvent(user.emp_id, dto));

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => !wrapperRef.current?.contains(e.target) && setOpen(false);
    const handleKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = () => {
    setMounted(true);
    setOpen((o) => !o);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="theme-toggle-btn"
        title="Calendar"
        aria-label="Calendar"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
      >
        <i className="ph ph-calendar-blank"></i>
      </button>
      {mounted && (
        <div className="header-calendar-popover" hidden={!open}>
          <Calendar fetchEvents={fetchEvents} onAddEvent={addEvent} />
        </div>
      )}
    </div>
  );
}

export default function Header({ onMenuClick }) {
  const { user, role } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pageTitle = useStore((s) => s.pageTitle);
  const { pathname } = useLocation();
  const [hasNotifications, setHasNotifications] = useState(false);
  const basePath = getRoleBasePath(role);
  const onNotifications = pathname.includes('notifications');

  // Unread indicator only lights up when the user actually has notifications.
  useEffect(() => {
    if (!user?.emp_id) return;
    getNotificationsForUser(user.emp_id)
      .then((list) => setHasNotifications(Boolean(list?.length)))
      .catch(() => {});
  }, [user?.emp_id]);

  return (
    <header className="top-header">
      <div className="header-left">
        <button type="button" className="header-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <i className="ph ph-list"></i>
        </button>
        <div className="header-title-group">
          <h2 className="header-title">{pageTitle}</h2>
          <span className="header-portal-label">{ROLE_PORTAL_LABELS[role]}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Moon while in light mode (switch to dark), sun while in dark mode. */}
        <button
          type="button"
          className="theme-toggle-btn"
          title="Toggle light/dark theme"
          aria-label="Toggle light/dark theme"
          onClick={toggleTheme}
        >
          <i className={cx('ph', isDark ? 'ph-sun' : 'ph-moon')}></i>
        </button>

        {CALENDAR_ROLES.includes(role) && <CalendarPopover user={user} />}

        <Link to={`${basePath}/notifications`} className="header-bell-link" aria-label="Notifications">
          <div className={cx('notification-bell', onNotifications && 'active-bell')}>
            <i className="ph ph-bell"></i>
            {hasNotifications && <span className="notif-dot"></span>}
          </div>
        </Link>

        <Link to={`${basePath}/profile`} title="My Profile" className="header-avatar-link">
          <div className="header-avatar">{user?.emp_name?.charAt(0)}</div>
        </Link>
      </div>
    </header>
  );
}

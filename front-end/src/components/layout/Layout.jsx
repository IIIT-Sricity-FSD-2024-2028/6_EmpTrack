import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import config from '../../config/config';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import ExitGuard from './ExitGuard';
import Header from './Header';
import Sidebar from './Sidebar';

// Portals that ship an in-browser demo dataset (and show their own demo notice) when
// no backend is configured. Every other portal needs the API for all of its data.
const DEMO_CAPABLE_ROLES = [ROLES.PLATFORM_ADMIN, ROLES.SUPPORT_MEMBER, ROLES.TEAM_LEAD];

/**
 * With VITE_API_URL unset, login still works (mock users) but every data request
 * fails with "VITE_API_URL is not configured." - which the pages only report as a
 * generic "Failed to load ...". Say what is actually wrong, once, at the top.
 */
function BackendNotConfiguredNotice() {
  const { user } = useAuth();
  if (config.apiUrl || !user || DEMO_CAPABLE_ROLES.includes(user.role)) return null;
  return (
    <div className="form-error field-error" role="alert" style={{ margin: '0 0 16px' }}>
      <i className="ph ph-warning-circle" aria-hidden="true"></i>
      <span>
        No backend is configured, so this portal cannot load any data. Set <code>VITE_API_URL</code> (e.g.
        {' '}<code>http://localhost:3000</code>) in <code>front-end/.env</code>, start the backend, then restart the dev server and log in again.
      </span>
    </div>
  );
}

/**
 * Shell for every logged-in page (same structure as the original pages:
 * .app-container > sidebar + .main-wrapper > header + .content-area).
 */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-wrapper">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area" id="main-content">
          <BackendNotConfiguredNotice />
          <Outlet />
        </div>
      </main>
      <ExitGuard />
    </div>
  );
}

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

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
          <Outlet />
        </div>
      </main>
    </div>
  );
}

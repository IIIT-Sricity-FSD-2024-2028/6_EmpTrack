// /js/app.js
import { auth } from './auth.js';
import { initLayout } from './components/layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication
    if (!auth.isAuthenticated() && !window.location.pathname.includes('login.html') && !window.location.pathname.endsWith('front-end/') && !window.location.pathname.endsWith('front-end/index.html')) {
        window.location.href = '/front-end/login.html';
        return;
    }

    // Role Guard: Prevents accessing wrong role portals
    if (auth.isAuthenticated()) {
        const role = auth.getRole();
        const path = window.location.pathname.toLowerCase();
        
        if (path.includes('/hr/') && role !== 'HR') {
            window.location.href = `/front-end/${role.toLowerCase()}/dashboard.html`;
        } else if (path.includes('/teamlead/') && role !== 'TEAMLEAD') {
            window.location.href = `/front-end/${role.toLowerCase()}/dashboard.html`;
        } else if (path.includes('/employee/') && role !== 'EMPLOYEE') {
            window.location.href = `/front-end/${role.toLowerCase()}/dashboard.html`;
        }
    }

    // Initialize layout (sidebar and header injection) on generic pages
    if (!window.location.pathname.includes('login.html')) {
        initLayout();
    }
});

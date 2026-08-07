// /js/app.js
import { auth } from './auth.js';
import { initLayout } from './components/layout.js';

// Pages that never require authentication, regardless of where the app is deployed.
const PUBLIC_PAGES = ['index.html', 'login.html', 'register.html', 'forgot-password.html', 'reset-password.html'];

// Role-specific portal folders. Any path containing one of these is a protected page.
const ROLE_FOLDERS = ['hr', 'teamlead', 'employee', 'admin'];

// Normalizes the current pathname into { root, page, folder } so redirect
// targets stay correct no matter where the app is served from ("/",
// "/front-end/", a GitHub Pages project path, etc.) instead of assuming a
// fixed "/front-end/" prefix.
function resolveLocation(pathname) {
    const lower = pathname.toLowerCase();

    for (const folder of ROLE_FOLDERS) {
        const marker = `/${folder}/`;
        const idx = lower.lastIndexOf(marker);
        if (idx !== -1) {
            const root = pathname.slice(0, idx + 1); // everything up to and including the role folder's parent slash
            const page = pathname.slice(idx + marker.length) || 'index.html';
            return { root, page, folder };
        }
    }

    // No role folder in the path: this is a top-level page (e.g. index.html, login.html).
    const lastSlash = pathname.lastIndexOf('/');
    const root = pathname.slice(0, lastSlash + 1) || '/';
    const page = pathname.slice(lastSlash + 1) || 'index.html';
    return { root, page, folder: null };
}

document.addEventListener('DOMContentLoaded', async () => {
    const { root, page, folder } = resolveLocation(window.location.pathname);
    const isPublicPage = PUBLIC_PAGES.includes(page.toLowerCase());

    // Check Authentication
    if (!auth.isAuthenticated() && !isPublicPage) {
        window.location.href = `${root}login.html`;
        return;
    }

    // Role Guard: Prevents accessing wrong role portals
    if (auth.isAuthenticated()) {
        const role = auth.getRole();
        if (folder && folder !== role.toLowerCase()) {
            window.location.href = `${root}${role.toLowerCase()}/dashboard.html`;
            return;
        }
    }

    // Initialize layout (sidebar and header injection) on protected pages only
    if (!isPublicPage) {
        initLayout();
    }
});

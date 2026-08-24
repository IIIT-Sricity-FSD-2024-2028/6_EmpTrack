// /js/views/support_member/my-tickets.js
import { renderTicketRows, paginate, renderPagination, auth, db } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let allTickets = [];
    let categories = [];
    let page = 1;
    const pageSize = 10;
    let quickFilter = 'all'; // all | open | high | escalated | resolved

    const tbody = document.getElementById('mt-tbody');
    const pagerEl = document.getElementById('mt-pagination');

    async function loadCategories() {
        try { categories = await db.getTicketCategories(); } catch (e) { categories = []; }
    }

    function onChanged() { loadTickets(); }

    function applyQuickFilter(tickets) {
        if (quickFilter === 'open') return tickets.filter((t) => ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(t.status));
        if (quickFilter === 'high') return tickets.filter((t) => (t.priority === 'High' || t.priority === 'Critical') && !['RESOLVED', 'CLOSED'].includes(t.status));
        if (quickFilter === 'escalated') return tickets.filter((t) => t.status === 'ESCALATED');
        if (quickFilter === 'resolved') return tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status));
        return tickets;
    }

    async function loadTickets() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading your tickets...</div></td></tr>`;
        try {
            allTickets = await db.getMyDashboardTickets({ assignedTo: 'me' });
            renderPage();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load your tickets.</td></tr>`;
        }
    }

    function renderPage() {
        const filtered = applyQuickFilter(allTickets);
        const { pageItems, page: safePage, totalPages, total } = paginate(filtered, page, pageSize);
        page = safePage;
        renderTicketRows(tbody, pageItems, { categories, onChanged, emptyMessage: 'No tickets in this view.' });
        renderPagination(pagerEl, { page, totalPages, total, pageSize }, (p) => { page = p; renderPage(); });
    }

    document.querySelectorAll('.chip-tab').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip-tab').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            quickFilter = chip.getAttribute('data-filter');
            page = 1;
            renderPage();
        });
    });

    await loadCategories();
    await loadTickets();
});

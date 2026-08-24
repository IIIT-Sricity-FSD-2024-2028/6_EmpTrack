// /js/views/support_member/escalated.js
import { renderTicketRows, paginate, renderPagination, auth, db } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let allTickets = [];
    let categories = [];
    let page = 1;
    const pageSize = 10;
    let scopeFilter = 'all'; // all | mine

    const tbody = document.getElementById('es-tbody');
    const pagerEl = document.getElementById('es-pagination');

    async function loadCategories() {
        try { categories = await db.getTicketCategories(); } catch (e) { categories = []; }
    }

    function onChanged() { loadTickets(); }

    async function loadTickets() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading escalated tickets...</div></td></tr>`;
        try {
            const filters = { escalatedOnly: true };
            if (scopeFilter === 'mine') filters.assignedTo = 'me';
            allTickets = await db.getMyDashboardTickets(filters);
            renderPage();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load escalated tickets.</td></tr>`;
        }
    }

    function renderPage() {
        const { pageItems, page: safePage, totalPages, total } = paginate(allTickets, page, pageSize);
        page = safePage;
        renderTicketRows(tbody, pageItems, { categories, onChanged, emptyMessage: 'No escalated tickets right now.' });
        renderPagination(pagerEl, { page, totalPages, total, pageSize }, (p) => { page = p; renderPage(); });
    }

    document.querySelectorAll('.chip-tab').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip-tab').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            scopeFilter = chip.getAttribute('data-filter');
            page = 1;
            loadTickets();
        });
    });

    await loadCategories();
    await loadTickets();
});

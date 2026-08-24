// /js/views/support_member/tickets.js
import { renderTicketRows, showToast, paginate, renderPagination, debounce, auth, db } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let allTickets = [];
    let categories = [];
    let page = 1;
    const pageSize = 10;

    const filters = { status: 'all', priority: 'all', category: 'all', assignedTo: 'all', search: '' };

    const params = new URLSearchParams(window.location.search);
    if (params.get('status')) filters.status = params.get('status');
    if (params.get('priority')) filters.priority = params.get('priority');

    const tbody = document.getElementById('tk-tbody');
    const pagerEl = document.getElementById('tk-pagination');

    async function loadCategories() {
        try {
            categories = await db.getTicketCategories();
            const sel = document.getElementById('category-filter');
            sel.innerHTML = `<option value="all">All Categories</option>` + categories.map((c) => `<option value="${c}">${c}</option>`).join('');
        } catch (e) { categories = []; }
    }

    function onChanged() { loadTickets(); }

    async function loadTickets() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading tickets...</div></td></tr>`;
        try {
            allTickets = await db.getMyDashboardTickets(filters);
            renderPage();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load tickets.</td></tr>`;
        }
    }

    function renderPage() {
        const { pageItems, page: safePage, totalPages, total } = paginate(allTickets, page, pageSize);
        page = safePage;
        renderTicketRows(tbody, pageItems, { categories, onChanged, emptyMessage: 'No support tickets match your filters.' });
        renderPagination(pagerEl, { page, totalPages, total, pageSize }, (p) => { page = p; renderPage(); });
    }

    document.getElementById('status-filter').addEventListener('change', (e) => { filters.status = e.target.value; page = 1; loadTickets(); });
    document.getElementById('priority-filter').addEventListener('change', (e) => { filters.priority = e.target.value; page = 1; loadTickets(); });
    document.getElementById('category-filter').addEventListener('change', (e) => { filters.category = e.target.value; page = 1; loadTickets(); });
    document.getElementById('assigned-filter').addEventListener('change', (e) => { filters.assignedTo = e.target.value === 'all' ? 'all' : e.target.value; page = 1; loadTickets(); });
    document.getElementById('search-input').addEventListener('input', debounce((e) => { filters.search = e.target.value.trim(); page = 1; loadTickets(); }, 350));

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        filters.status = 'all'; filters.priority = 'all'; filters.category = 'all'; filters.assignedTo = 'all'; filters.search = '';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('priority-filter').value = 'all';
        document.getElementById('category-filter').value = 'all';
        document.getElementById('assigned-filter').value = 'all';
        document.getElementById('search-input').value = '';
        page = 1;
        loadTickets();
    });

    document.getElementById('status-filter').value = filters.status;
    document.getElementById('priority-filter').value = filters.priority;

    await loadCategories();
    await loadTickets();
});

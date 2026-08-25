// /js/views/support_member/my-tickets.js
// Primary ticket-management page for the Support Member. Exposes exactly two scopes -
// "My Tickets" (assignedTo: 'me', the default) and the shared "Unassigned Support Queue"
// (assignedTo: 'unassigned', via ?assignment=unassigned) - never every ticket regardless
// of owner. Status/priority/category/search filter server-side via the existing
// /support-member/tickets endpoint (see store.js getMyDashboardTickets); the date range
// filter is applied client-side since the backend doesn't expose a date query param.
import { renderTicketRows, showToast, paginate, renderPagination, debounce, auth, db } from './_board.js';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'];
const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const VALID_DATES = ['today', '7days', '30days', 'month'];

function matchesDateFilter(ticket, dateFilter) {
    if (!dateFilter || dateFilter === 'all') return true;
    const isResolvedLike = ['RESOLVED', 'CLOSED'].includes(ticket.status);
    const raw = isResolvedLike ? (ticket.resolved_date || ticket.created_date) : ticket.created_date;
    if (!raw) return false;
    const when = new Date(raw);
    if (isNaN(when.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') return when >= startOfToday;
    if (dateFilter === '7days') { const cutoff = new Date(startOfToday); cutoff.setDate(cutoff.getDate() - 6); return when >= cutoff; }
    if (dateFilter === '30days') { const cutoff = new Date(startOfToday); cutoff.setDate(cutoff.getDate() - 29); return when >= cutoff; }
    if (dateFilter === 'month') return when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth();
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let allTickets = [];
    let categories = [];
    let page = 1;
    const pageSize = 10;

    // assignment: '' = tickets assigned to me (the default/only-mine scope), 'unassigned'
    // = the shared Unassigned Support Queue. These are the only two scopes this page
    // exposes - there is no "everyone's tickets" view (see dashboard.js for why).
    const filters = { assignment: '', status: 'all', priority: 'all', category: 'all', search: '', date: 'all' };

    const sectionTitleEl = document.getElementById('mt-section-title');
    const assignmentTabs = document.querySelectorAll('.chip-tab[data-assignment]');
    const statusEl = document.getElementById('status-filter');
    const priorityEl = document.getElementById('priority-filter');
    const categoryEl = document.getElementById('category-filter');
    const dateEl = document.getElementById('date-filter');
    const searchEl = document.getElementById('search-input');
    const tbody = document.getElementById('mt-tbody');
    const pagerEl = document.getElementById('mt-pagination');

    // --- Read the initial filter state from the query string (dashboard stat cards and
    // "View all" link into this page this way) so the page can be deep-linked. ---
    function readFiltersFromUrl() {
        const params = new URLSearchParams(window.location.search);

        if ((params.get('assignment') || '').toLowerCase() === 'unassigned') filters.assignment = 'unassigned';

        const status = (params.get('status') || '').toUpperCase();
        if (VALID_STATUSES.includes(status)) filters.status = status;

        const priorityRaw = params.get('priority');
        if (priorityRaw) {
            const match = VALID_PRIORITIES.find((p) => p.toLowerCase() === priorityRaw.toLowerCase());
            if (match) filters.priority = match;
        }

        const search = params.get('search');
        if (search) filters.search = search;

        const date = (params.get('date') || '').toLowerCase();
        if (VALID_DATES.includes(date)) filters.date = date;

        // Category depends on the categories list, which isn't loaded yet - stash the raw
        // value and resolve it once loadCategories() has run (see applyPendingCategory()).
        return params.get('category');
    }

    function applyPendingCategory(pendingCategory) {
        if (!pendingCategory) return;
        const match = categories.find((c) => c.toLowerCase() === pendingCategory.toLowerCase());
        if (match) filters.category = match;
    }

    function syncControlsFromFilters() {
        statusEl.value = filters.status;
        priorityEl.value = filters.priority;
        categoryEl.value = filters.category;
        dateEl.value = filters.date;
        searchEl.value = filters.search;
        assignmentTabs.forEach((tab) => tab.classList.toggle('active', tab.getAttribute('data-assignment') === filters.assignment));
        sectionTitleEl.textContent = filters.assignment === 'unassigned' ? 'Unassigned Support Queue' : 'Tickets Assigned to Me';
    }

    // --- Keep the URL in sync with the current filters (no navigation/reload) so the
    // view is shareable/bookmarkable and the browser back button behaves sensibly. ---
    function syncUrlFromFilters() {
        const params = new URLSearchParams();
        if (filters.assignment === 'unassigned') params.set('assignment', 'unassigned');
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.priority !== 'all') params.set('priority', filters.priority);
        if (filters.category !== 'all') params.set('category', filters.category);
        if (filters.search) params.set('search', filters.search);
        if (filters.date !== 'all') params.set('date', filters.date);
        const qs = params.toString();
        const newUrl = window.location.pathname + (qs ? `?${qs}` : '');
        window.history.replaceState({}, '', newUrl);
    }

    async function loadCategories() {
        try {
            categories = await db.getTicketCategories();
            categoryEl.innerHTML = `<option value="all">All Categories</option>` + categories.map((c) => `<option value="${c}">${c}</option>`).join('');
        } catch (e) { categories = []; }
    }

    function onChanged() { loadTickets(); }

    async function loadTickets() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading your tickets...</div></td></tr>`;
        try {
            allTickets = await db.getMyDashboardTickets({
                assignedTo: filters.assignment === 'unassigned' ? 'unassigned' : 'me',
                status: filters.status,
                priority: filters.priority,
                category: filters.category,
                search: filters.search,
            });
            renderPage();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Unable to load tickets. Please try again.</td></tr>`;
        }
    }

    function renderPage() {
        const filtered = allTickets.filter((t) => matchesDateFilter(t, filters.date));
        const emptyMessage = filters.assignment === 'unassigned' ? 'No unassigned tickets match the selected filters.' : 'No tickets match the selected filters.';
        const { pageItems, page: safePage, totalPages, total } = paginate(filtered, page, pageSize);
        page = safePage;
        renderTicketRows(tbody, pageItems, { categories, onChanged, emptyMessage });
        renderPagination(pagerEl, { page, totalPages, total, pageSize }, (p) => { page = p; renderPage(); });
    }

    function onFilterChange() {
        page = 1;
        syncUrlFromFilters();
        loadTickets();
    }

    assignmentTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            filters.assignment = tab.getAttribute('data-assignment');
            syncControlsFromFilters();
            onFilterChange();
        });
    });

    statusEl.addEventListener('change', (e) => { filters.status = e.target.value; onFilterChange(); });
    priorityEl.addEventListener('change', (e) => { filters.priority = e.target.value; onFilterChange(); });
    categoryEl.addEventListener('change', (e) => { filters.category = e.target.value; onFilterChange(); });
    dateEl.addEventListener('change', (e) => { filters.date = e.target.value; onFilterChange(); });
    searchEl.addEventListener('input', debounce((e) => { filters.search = e.target.value.trim(); onFilterChange(); }, 350));

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        filters.status = 'all'; filters.priority = 'all'; filters.category = 'all'; filters.search = ''; filters.date = 'all';
        // Clear Filters resets the field filters but intentionally leaves `assignment`
        // (My Tickets vs. Unassigned Queue) alone - it's a scope choice, not a filter.
        syncControlsFromFilters();
        onFilterChange();
    });

    const pendingCategory = readFiltersFromUrl();
    await loadCategories();
    applyPendingCategory(pendingCategory);
    syncControlsFromFilters();
    syncUrlFromFilters();
    await loadTickets();
});

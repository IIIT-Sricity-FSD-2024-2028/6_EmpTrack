// /js/views/technical_member/assigned-issues.js
import { renderIssueRows, paginate, renderPagination, debounce, auth, db } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let allIssues = [];
    let page = 1;
    const pageSize = 10;

    const filters = { status: 'all', priority: 'all', search: '' };

    const params = new URLSearchParams(window.location.search);
    if (params.get('status')) filters.status = params.get('status');
    if (params.get('priority')) filters.priority = params.get('priority');

    const tbody = document.getElementById('ai-tbody');
    const pagerEl = document.getElementById('ai-pagination');

    function onChanged() { loadIssues(); }

    async function loadIssues() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading assigned issues...</div></td></tr>`;
        try {
            allIssues = await db.getMyTechnicalIssues({ ...filters, scope: 'active' });
            renderPage();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load assigned issues.</td></tr>`;
        }
    }

    function renderPage() {
        const { pageItems, page: safePage, totalPages, total } = paginate(allIssues, page, pageSize);
        page = safePage;
        renderIssueRows(tbody, pageItems, { onChanged, emptyMessage: 'No assigned issues match your filters.' });
        renderPagination(pagerEl, { page, totalPages, total, pageSize }, (p) => { page = p; renderPage(); });
    }

    document.getElementById('status-filter').addEventListener('change', (e) => { filters.status = e.target.value; page = 1; loadIssues(); });
    document.getElementById('priority-filter').addEventListener('change', (e) => { filters.priority = e.target.value; page = 1; loadIssues(); });
    document.getElementById('search-input').addEventListener('input', debounce((e) => { filters.search = e.target.value.trim(); page = 1; loadIssues(); }, 350));

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        filters.status = 'all'; filters.priority = 'all'; filters.search = '';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('priority-filter').value = 'all';
        document.getElementById('search-input').value = '';
        page = 1;
        loadIssues();
    });

    document.getElementById('status-filter').value = filters.status;
    document.getElementById('priority-filter').value = filters.priority;

    await loadIssues();
});

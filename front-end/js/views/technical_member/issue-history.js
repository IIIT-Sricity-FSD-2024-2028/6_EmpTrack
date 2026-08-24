// /js/views/technical_member/issue-history.js
import { renderIssueRows, paginate, renderPagination, auth, db } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let allIssues = [];
    let page = 1;
    const pageSize = 10;
    let quickFilter = 'all'; // all | unsubmitted | pending | verified

    const tbody = document.getElementById('ih-tbody');
    const pagerEl = document.getElementById('ih-pagination');

    function onChanged() { loadIssues(); }

    function applyQuickFilter(issues) {
        if (quickFilter === 'unsubmitted') return issues.filter((t) => !t.verification_status);
        if (quickFilter === 'pending') return issues.filter((t) => t.verification_status === 'PENDING_VERIFICATION');
        if (quickFilter === 'verified') return issues.filter((t) => t.verification_status === 'VERIFIED');
        return issues;
    }

    async function loadIssues() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading issue history...</div></td></tr>`;
        try {
            allIssues = await db.getMyTechnicalIssues({ scope: 'history' });
            renderPage();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load issue history.</td></tr>`;
        }
    }

    function renderPage() {
        const filtered = applyQuickFilter(allIssues);
        const { pageItems, page: safePage, totalPages, total } = paginate(filtered, page, pageSize);
        page = safePage;
        renderIssueRows(tbody, pageItems, { onChanged, emptyMessage: 'No completed issues in this view.' });
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

    await loadIssues();
});

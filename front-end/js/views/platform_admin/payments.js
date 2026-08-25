// /js/views/platform_admin/payments.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, animateCount, formatDate, formatCurrency, debounce, paginate, renderPagination, showToast } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 10;
    let allPayments = [];
    let filtered = [];
    let page = 1;
    let searchTerm = '';
    let companyFilter = '';
    let statusFilter = 'all';
    let dateFrom = '';
    let dateTo = '';

    const tbody = document.getElementById('pay-tbody');
    const pagerEl = document.getElementById('pay-pagination');

    function statusBadgeClass(status) {
        if (status === 'PAID') return 'badge-active';
        if (status === 'FAILED') return 'badge-suspended';
        return 'badge-pending';
    }

    async function loadSummary() {
        const grid = document.getElementById('payments-stats-grid');
        try {
            const summary = await db.getPlatformAdminPaymentSummary();
            const defs = [
                { key: 'assigned_companies', label: 'Assigned Companies', icon: 'ph-buildings', tone: 'primary', currency: false },
                { key: 'paid_payments', label: 'Paid Payments', icon: 'ph-check-circle', tone: 'success', currency: false },
                { key: 'pending_payments', label: 'Pending Payments', icon: 'ph-hourglass-medium', tone: 'warning', currency: false },
                { key: 'revenue', label: 'Revenue', icon: 'ph-currency-circle-dollar', tone: 'info', currency: true },
            ];
            grid.innerHTML = defs.map((def) => `
                <div class="card stat-card">
                    <div class="stat-icon ${def.tone}"><i class="ph-fill ${def.icon}"></i></div>
                    <div>
                        <div class="stat-value" id="pstat-${def.key}">${def.currency ? formatCurrency(0) : '0'}</div>
                        <div class="stat-label">${def.label}</div>
                    </div>
                </div>
            `).join('');
            defs.forEach((def) => {
                const el = document.getElementById(`pstat-${def.key}`);
                if (def.currency) el.textContent = formatCurrency(summary[def.key]);
                else animateCount(el, summary[def.key] || 0);
            });
        } catch (e) {
            grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load summary.</div>`;
        }
    }

    function populateCompanyFilter() {
        const select = document.getElementById('pay-company-filter');
        const seen = new Map();
        allPayments.forEach((p) => { if (!seen.has(p.company_id)) seen.set(p.company_id, p.company_name); });
        const current = select.value;
        select.innerHTML = '<option value="">All Companies</option>' +
            [...seen.entries()].map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`).join('');
        select.value = current;
    }

    async function loadPayments() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading payments...</div></td></tr>`;
        try {
            allPayments = await db.getPlatformAdminPayments({ companyId: companyFilter, status: statusFilter, search: searchTerm });
            populateCompanyFilter();
            applyDateFilterAndRender();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="8"><i class="ph ph-warning-circle"></i> Failed to load payments.</td></tr>`;
        }
    }

    // Date range is applied client-side over the already role/search/status/company
    // scoped result set - a small mock dataset doesn't warrant another server round trip.
    function applyDateFilterAndRender() {
        filtered = allPayments.filter((p) => {
            if (dateFrom && p.payment_date < dateFrom) return false;
            if (dateTo && p.payment_date > dateTo) return false;
            return true;
        });
        page = 1;
        renderTable();
    }

    function renderTable() {
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><i class="ph ph-receipt" style="font-size:28px; display:block; margin-bottom:8px;"></i>No payments found.</td></tr>`;
            pagerEl.innerHTML = '';
            return;
        }
        const result = paginate(filtered, page, PAGE_SIZE);
        page = result.page;
        tbody.innerHTML = result.pageItems.map((p) => `
            <tr>
                <td>${escapeHtml(p.company_name)}</td>
                <td>${escapeHtml(p.company_admin_name || '-')}</td>
                <td>${escapeHtml(p.plan_name)}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td>${p.is_mock ? `<span class="badge badge-mock">MOCK</span>` : escapeHtml(p.payment_method || '-')}</td>
                <td>${escapeHtml(p.transaction_id)}</td>
                <td><span class="badge ${statusBadgeClass(p.payment_status)}">${escapeHtml(p.payment_status)}</span></td>
                <td>${formatDate(p.payment_date)}</td>
            </tr>
        `).join('');
        renderPagination(pagerEl, result, (newPage) => { page = newPage; renderTable(); });
    }

    document.getElementById('pay-search').addEventListener('input', debounce((e) => {
        searchTerm = e.target.value.trim();
        loadPayments();
    }, 350));
    document.getElementById('pay-company-filter').addEventListener('change', (e) => { companyFilter = e.target.value; loadPayments(); });
    document.getElementById('pay-status-filter').addEventListener('change', (e) => { statusFilter = e.target.value; loadPayments(); });
    document.getElementById('pay-date-from').addEventListener('change', (e) => { dateFrom = e.target.value; applyDateFilterAndRender(); });
    document.getElementById('pay-date-to').addEventListener('change', (e) => { dateTo = e.target.value; applyDateFilterAndRender(); });
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        searchTerm = ''; companyFilter = ''; statusFilter = 'all'; dateFrom = ''; dateTo = '';
        document.getElementById('pay-search').value = '';
        document.getElementById('pay-company-filter').value = '';
        document.getElementById('pay-status-filter').value = 'all';
        document.getElementById('pay-date-from').value = '';
        document.getElementById('pay-date-to').value = '';
        loadPayments();
    });

    await loadSummary();
    await loadPayments();
});

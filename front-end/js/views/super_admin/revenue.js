// /js/views/super_admin/revenue.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, animateCount, formatCurrency, formatDate, loadChartJs, chartTheme, showToast, debounce, paginate, renderPagination } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 10;
    let transactions = [];
    let page = 1;
    let companyFilter = '';
    let platformAdminFilter = '';
    let statusFilter = 'all';
    let searchTerm = '';
    let dateFrom = '';
    let dateTo = '';
    let rawTransactions = [];

    const tbody = document.getElementById('txn-tbody');
    const pagerEl = document.getElementById('txn-pagination');

    async function loadStats() {
        const grid = document.getElementById('revenue-stats-grid');
        try {
            const summary = await db.getRevenueSummary();
            const defs = [
                { key: 'total_revenue', label: 'Total Revenue', icon: 'ph-currency-circle-dollar', tone: 'success', currency: true },
                { key: 'monthly_revenue', label: 'Monthly Revenue', icon: 'ph-calendar-check', tone: 'primary', currency: true },
                { key: 'annual_revenue', label: 'Annual Revenue', icon: 'ph-chart-line-up', tone: 'purple', currency: true },
                { key: 'transaction_count', label: 'Successful Payments', icon: 'ph-check-circle', tone: 'info', currency: false },
                { key: 'pending_count', label: 'Pending Payments', icon: 'ph-hourglass-medium', tone: 'warning', currency: false },
            ];
            grid.innerHTML = defs.map((def) => `
                <div class="card stat-card">
                    <div class="stat-icon ${def.tone}"><i class="ph-fill ${def.icon}"></i></div>
                    <div>
                        <div class="stat-value" id="rev-${def.key}">${def.currency ? '$0' : '0'}</div>
                        <div class="stat-label">${def.label}</div>
                    </div>
                </div>
            `).join('');
            defs.forEach((def) => {
                const el = document.getElementById(`rev-${def.key}`);
                if (def.currency) el.textContent = formatCurrency(summary[def.key]);
                else animateCount(el, summary[def.key] || 0);
            });
        } catch (e) {
            grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load revenue summary.</div>`;
        }
    }

    async function loadCharts() {
        await loadChartJs();
        const { textColor, gridColor } = chartTheme();
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', sans-serif";
        const commonOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true } },
        };

        try {
            const byPlan = await db.getRevenueByPlan();
            new Chart(document.getElementById('chartByPlan'), {
                type: 'bar',
                data: { labels: byPlan.map((p) => p.plan_name), datasets: [{ label: 'Revenue', data: byPlan.map((p) => p.revenue), backgroundColor: '#2563EB', borderRadius: 4 }] },
                options: commonOptions,
            });
        } catch (e) { /* skeleton stays */ }
        document.getElementById('skel-by-plan').style.display = 'none';

        try {
            const byCompany = await db.getRevenueByCompany();
            new Chart(document.getElementById('chartByCompany'), {
                type: 'bar',
                data: { labels: byCompany.map((c) => c.company_name), datasets: [{ label: 'Revenue', data: byCompany.map((c) => c.revenue), backgroundColor: '#22C55E', borderRadius: 4 }] },
                options: { ...commonOptions, indexAxis: 'y' },
            });
        } catch (e) { /* skeleton stays */ }
        document.getElementById('skel-by-company').style.display = 'none';

        try {
            const byPA = await db.getRevenueByPlatformAdmin();
            new Chart(document.getElementById('chartByPlatformAdmin'), {
                type: 'bar',
                data: { labels: byPA.map((p) => p.platform_admin_name), datasets: [{ label: 'Revenue', data: byPA.map((p) => p.revenue), backgroundColor: '#7C3AED', borderRadius: 4 }] },
                options: { ...commonOptions, indexAxis: 'y' },
            });
        } catch (e) { /* skeleton stays */ }
        document.getElementById('skel-by-pa').style.display = 'none';
    }

    function statusBadgeClass(status) {
        if (status === 'PAID') return 'badge-active';
        if (status === 'FAILED') return 'badge-suspended';
        return 'badge-pending';
    }

    async function loadTransactions() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading transactions...</div></td></tr>`;
        try {
            rawTransactions = await db.getRevenueTransactions({
                companyId: companyFilter,
                status: statusFilter,
                platformAdminId: platformAdminFilter,
                search: searchTerm,
            });
            applyDateFilterAndRender();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load transactions.</td></tr>`;
        }
    }

    // Date range is applied client-side over the already-filtered result set - a small
    // mock dataset doesn't warrant another server round trip for this.
    function applyDateFilterAndRender() {
        transactions = rawTransactions.filter((t) => {
            if (dateFrom && t.payment_date < dateFrom) return false;
            if (dateTo && t.payment_date > dateTo) return false;
            return true;
        });
        page = 1;
        renderTable();
    }

    function renderTable() {
        if (transactions.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="9"><i class="ph ph-receipt" style="font-size:28px; display:block; margin-bottom:8px;"></i>No transactions found.</td></tr>`;
            pagerEl.innerHTML = '';
            return;
        }
        const result = paginate(transactions, page, PAGE_SIZE);
        page = result.page;
        tbody.innerHTML = result.pageItems.map((t) => `
            <tr>
                <td>${escapeHtml(t.company_name)}</td>
                <td>${escapeHtml(t.company_admin_name || '-')}</td>
                <td>${escapeHtml(t.platform_admin_name || '-')}</td>
                <td>${escapeHtml(t.plan_name || t.plan_id)}</td>
                <td>${formatCurrency(t.amount)}</td>
                <td>${t.is_mock ? `<span class="badge badge-purple">MOCK</span>` : escapeHtml(t.payment_method || '-')}</td>
                <td>${escapeHtml(t.transaction_id)}</td>
                <td><span class="badge ${statusBadgeClass(t.payment_status)}">${escapeHtml(t.payment_status)}</span></td>
                <td>${formatDate(t.payment_date)}</td>
            </tr>
        `).join('');
        renderPagination(pagerEl, result, (newPage) => { page = newPage; renderTable(); });
    }

    async function loadCompanyOptions() {
        try {
            const companies = await db.getCompanies();
            const select = document.getElementById('company-filter');
            companies.forEach((c) => {
                const opt = document.createElement('option');
                opt.value = c.company_id;
                opt.textContent = c.company_name;
                select.appendChild(opt);
            });
        } catch (e) { /* non-critical */ }
    }

    async function loadPlatformAdminOptions() {
        try {
            const admins = await db.getPlatformAdmins();
            const select = document.getElementById('platform-admin-filter');
            admins.forEach((a) => {
                const opt = document.createElement('option');
                opt.value = a.emp_id;
                opt.textContent = a.emp_name;
                select.appendChild(opt);
            });
        } catch (e) { /* non-critical */ }
    }

    document.getElementById('txn-search').addEventListener('input', debounce((e) => { searchTerm = e.target.value.trim(); loadTransactions(); }, 350));
    document.getElementById('company-filter').addEventListener('change', (e) => { companyFilter = e.target.value; loadTransactions(); });
    document.getElementById('platform-admin-filter').addEventListener('change', (e) => { platformAdminFilter = e.target.value; loadTransactions(); });
    document.getElementById('status-filter').addEventListener('change', (e) => { statusFilter = e.target.value; loadTransactions(); });
    document.getElementById('txn-date-from').addEventListener('change', (e) => { dateFrom = e.target.value; applyDateFilterAndRender(); });
    document.getElementById('txn-date-to').addEventListener('change', (e) => { dateTo = e.target.value; applyDateFilterAndRender(); });
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        companyFilter = '';
        platformAdminFilter = '';
        statusFilter = 'all';
        searchTerm = '';
        dateFrom = '';
        dateTo = '';
        document.getElementById('txn-search').value = '';
        document.getElementById('company-filter').value = '';
        document.getElementById('platform-admin-filter').value = '';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('txn-date-from').value = '';
        document.getElementById('txn-date-to').value = '';
        loadTransactions();
    });

    await loadStats();
    await loadCompanyOptions();
    await loadPlatformAdminOptions();
    await loadTransactions();
    loadCharts().catch(() => showToast('Some charts failed to load.', 'error'));
});

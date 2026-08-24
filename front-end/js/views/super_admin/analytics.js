// /js/views/super_admin/analytics.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { animateCount, formatCurrency, loadChartJs, chartTheme, showToast } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let chartCompany, chartEmployee, chartUsage;
    const rangeSelect = document.getElementById('range-select');
    const fromInput = document.getElementById('from-date');
    const toInput = document.getElementById('to-date');

    rangeSelect.addEventListener('change', () => {
        const isCustom = rangeSelect.value === 'custom';
        fromInput.style.display = isCustom ? 'inline-block' : 'none';
        toInput.style.display = isCustom ? 'inline-block' : 'none';
    });

    function getRangeParams() {
        if (rangeSelect.value === 'custom' && fromInput.value) {
            return { from: fromInput.value, to: toInput.value || undefined };
        }
        return { range: rangeSelect.value };
    }

    async function loadStats() {
        const grid = document.getElementById('analytics-stats-grid');
        try {
            const [overview, usage] = await Promise.all([
                db.getAnalyticsOverview(),
                db.getPlatformActivitySummary(getRangeParams().range, getRangeParams().from, getRangeParams().to),
            ]);
            const defs = [
                { key: 'total_companies', label: 'Total Registered Companies', icon: 'ph-buildings', tone: 'primary', value: overview.total_companies },
                { key: 'active_companies', label: 'Active Companies', icon: 'ph-check-circle', tone: 'success', value: overview.active_companies },
                { key: 'total_employees', label: 'Total Employees', icon: 'ph-users-three', tone: 'info', value: overview.total_employees },
                { key: 'active_subscriptions', label: 'Active Subscriptions', icon: 'ph-credit-card', tone: 'purple', value: overview.active_subscriptions },
                { key: 'total_actions', label: 'Platform Actions (range)', icon: 'ph-activity', tone: 'warning', value: usage.total_actions },
            ];
            grid.innerHTML = defs.map((def) => `
                <div class="card stat-card">
                    <div class="stat-icon ${def.tone}"><i class="ph-fill ${def.icon}"></i></div>
                    <div>
                        <div class="stat-value" id="an-${def.key}">0</div>
                        <div class="stat-label">${def.label}</div>
                    </div>
                </div>
            `).join('');
            defs.forEach((def) => animateCount(document.getElementById(`an-${def.key}`), def.value || 0));
        } catch (e) {
            grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load analytics.</div>`;
        }
    }

    async function loadCharts() {
        await loadChartJs();
        const { textColor, gridColor } = chartTheme();
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', sans-serif";
        const commonOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true } },
        };
        const { range, from, to } = getRangeParams();

        document.getElementById('skel-company').style.display = 'flex';
        document.getElementById('skel-employee').style.display = 'flex';
        document.getElementById('skel-usage').style.display = 'flex';

        try {
            const companyGrowth = await db.getCompanyGrowth(range, from, to);
            if (chartCompany) chartCompany.destroy();
            chartCompany = new Chart(document.getElementById('chartCompany'), {
                type: 'line',
                data: {
                    labels: companyGrowth.map((b) => b.period),
                    datasets: [{ label: 'Total Companies (= Active Subscriptions)', data: companyGrowth.map((b) => b.total), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 2, fill: true, tension: 0.4 }],
                },
                options: commonOptions,
            });
        } catch (e) { /* skeleton stays */ }
        document.getElementById('skel-company').style.display = 'none';

        try {
            const employeeGrowth = await db.getEmployeeGrowth(range, from, to);
            if (chartEmployee) chartEmployee.destroy();
            chartEmployee = new Chart(document.getElementById('chartEmployee'), {
                type: 'line',
                data: {
                    labels: employeeGrowth.map((b) => b.period),
                    datasets: [{ label: 'Total Employees', data: employeeGrowth.map((b) => b.total), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, fill: true, tension: 0.4 }],
                },
                options: commonOptions,
            });
        } catch (e) { /* skeleton stays */ }
        document.getElementById('skel-employee').style.display = 'none';

        try {
            const usage = await db.getPlatformActivitySummary(range, from, to);
            if (chartUsage) chartUsage.destroy();
            chartUsage = new Chart(document.getElementById('chartUsage'), {
                type: 'bar',
                data: { labels: usage.by_action.map((a) => a.action), datasets: [{ label: 'Actions', data: usage.by_action.map((a) => a.count), backgroundColor: '#3B82F6', borderRadius: 4 }] },
                options: { ...commonOptions, indexAxis: 'y' },
            });
        } catch (e) { /* skeleton stays */ }
        document.getElementById('skel-usage').style.display = 'none';
    }

    document.getElementById('btn-apply-range').addEventListener('click', () => {
        loadStats();
        loadCharts().catch(() => showToast('Some charts failed to load.', 'error'));
    });

    await loadStats();
    loadCharts().catch(() => showToast('Some charts failed to load.', 'error'));
});

// /js/views/super_admin/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { animateCount, formatCurrency, loadChartJs, chartTheme, showToast } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const STAT_DEFS = [
        { key: 'total_companies', label: 'Total Companies', icon: 'ph-buildings', tone: 'primary' },
        { key: 'active_companies', label: 'Active Companies', icon: 'ph-check-circle', tone: 'success' },
        { key: 'inactive_companies', label: 'Inactive / Suspended', icon: 'ph-pause-circle', tone: 'warning' },
        { key: 'total_platform_admins', label: 'Platform Admins', icon: 'ph-shield-star', tone: 'purple' },
        { key: 'total_employees', label: 'Total Employees', icon: 'ph-users-three', tone: 'info' },
        { key: 'active_subscriptions', label: 'Active Subscriptions', icon: 'ph-credit-card', tone: 'primary' },
        { key: 'monthly_revenue', label: 'Monthly Revenue', icon: 'ph-currency-circle-dollar', tone: 'success', currency: true },
        { key: 'annual_revenue', label: 'Annual Revenue', icon: 'ph-chart-line-up', tone: 'success', currency: true },
        { key: 'open_critical_issues', label: 'Open Critical Issues', icon: 'ph-siren', tone: 'danger' },
    ];

    async function loadStats() {
        const grid = document.getElementById('sa-stats-grid');
        try {
            const overview = await db.getAnalyticsOverview();
            grid.innerHTML = STAT_DEFS.map((def) => `
                <div class="card stat-card">
                    <div class="stat-icon ${def.tone}"><i class="ph-fill ${def.icon}"></i></div>
                    <div>
                        <div class="stat-value" id="stat-${def.key}">${def.currency ? '$0' : '0'}</div>
                        <div class="stat-label">${def.label}</div>
                    </div>
                </div>
            `).join('');

            STAT_DEFS.forEach((def) => {
                const el = document.getElementById(`stat-${def.key}`);
                const value = overview[def.key] || 0;
                if (def.currency) {
                    el.textContent = formatCurrency(value);
                } else {
                    animateCount(el, value);
                }
            });
        } catch (e) {
            grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load dashboard summary.</div>`;
        }
    }

    async function loadCharts() {
        await loadChartJs();
        const { textColor, gridColor } = chartTheme();
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', sans-serif";
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true },
            },
        };

        try {
            const companyGrowth = await db.getCompanyGrowth('6m');
            new Chart(document.getElementById('chartCompanyGrowth'), {
                type: 'line',
                data: {
                    labels: companyGrowth.map((b) => b.period),
                    datasets: [{
                        label: 'Total Companies', data: companyGrowth.map((b) => b.total),
                        borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 2, fill: true, tension: 0.4,
                    }],
                },
                options: commonOptions,
            });
        } catch (e) { /* leave skeleton */ }
        document.getElementById('skel-company-growth').style.display = 'none';

        try {
            const employeeGrowth = await db.getEmployeeGrowth('6m');
            new Chart(document.getElementById('chartEmployeeGrowth'), {
                type: 'line',
                data: {
                    labels: employeeGrowth.map((b) => b.period),
                    datasets: [{
                        label: 'Total Employees', data: employeeGrowth.map((b) => b.total),
                        borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, fill: true, tension: 0.4,
                    }],
                },
                options: commonOptions,
            });
        } catch (e) { /* leave skeleton */ }
        document.getElementById('skel-employee-growth').style.display = 'none';

        try {
            const subDist = await db.getSubscriptionDistribution();
            new Chart(document.getElementById('chartSubDist'), {
                type: 'doughnut',
                data: {
                    labels: subDist.map((p) => p.plan_name),
                    datasets: [{
                        data: subDist.map((p) => p.company_count),
                        backgroundColor: ['#2563EB', '#7C3AED', '#F97316', '#22C55E'],
                        borderWidth: 1, borderColor: 'var(--bg-surface)',
                    }],
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 16 } } } },
            });
        } catch (e) { /* leave skeleton */ }
        document.getElementById('skel-sub-dist').style.display = 'none';

        try {
            const byPlan = await db.getRevenueByPlan();
            new Chart(document.getElementById('chartRevenue'), {
                type: 'bar',
                data: {
                    labels: byPlan.map((p) => p.plan_name),
                    datasets: [{ label: 'Revenue', data: byPlan.map((p) => p.revenue), backgroundColor: '#F97316', borderRadius: 4 }],
                },
                options: commonOptions,
            });
        } catch (e) { /* leave skeleton */ }
        document.getElementById('skel-revenue').style.display = 'none';

        try {
            const activity = await db.getPlatformActivitySummary('30d');
            new Chart(document.getElementById('chartActivity'), {
                type: 'bar',
                data: {
                    labels: activity.by_action.map((a) => a.action),
                    datasets: [{ label: 'Actions', data: activity.by_action.map((a) => a.count), backgroundColor: '#3B82F6', borderRadius: 4 }],
                },
                options: { ...commonOptions, indexAxis: 'y' },
            });
        } catch (e) { /* leave skeleton */ }
        document.getElementById('skel-activity').style.display = 'none';
    }

    await loadStats();
    loadCharts().catch(() => showToast('Some charts failed to load.', 'error'));
});

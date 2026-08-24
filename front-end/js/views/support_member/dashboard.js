// /js/views/support_member/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { animateCount, loadChartJs, chartTheme, showToast } from '../../utils/sa-common.js';
import { renderTicketRows } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const STAT_DEFS = [
        { key: 'new_tickets', label: 'New Tickets', icon: 'ph-ticket', tone: 'primary', link: 'tickets.html?status=OPEN' },
        { key: 'my_open_tickets', label: 'My Open Tickets', icon: 'ph-user-focus', tone: 'info', link: 'my-tickets.html' },
        { key: 'high_priority_tickets', label: 'High Priority Tickets', icon: 'ph-fire', tone: 'danger', link: 'tickets.html?priority=High' },
        { key: 'in_progress', label: 'In Progress', icon: 'ph-spinner-gap', tone: 'purple', link: 'tickets.html?status=IN_PROGRESS' },
        { key: 'awaiting_customer', label: 'Awaiting Customer Response', icon: 'ph-hourglass-medium', tone: 'warning', link: 'tickets.html?status=WAITING_FOR_CUSTOMER' },
        { key: 'escalated_tickets', label: 'Escalated Tickets', icon: 'ph-arrow-up-right', tone: 'danger', link: 'escalated.html' },
        { key: 'resolved_today', label: 'Resolved Today', icon: 'ph-check-circle', tone: 'success', link: 'tickets.html?status=RESOLVED' },
        { key: 'total_open_tickets', label: 'Total Open Tickets', icon: 'ph-tray', tone: 'info', link: 'tickets.html' },
    ];

    const grid = document.getElementById('sm-stats-grid');
    const recentEl = document.getElementById('sm-recent-tickets');

    let stats = null;
    try {
        stats = await db.getSupportMemberStats();

        grid.innerHTML = STAT_DEFS.map((def) => `
            <div class="card stat-card clickable" data-link="${def.link}">
                <div class="stat-icon ${def.tone}"><i class="ph-fill ${def.icon}"></i></div>
                <div>
                    <div class="stat-value" id="stat-${def.key}">0</div>
                    <div class="stat-label">${def.label}</div>
                </div>
            </div>
        `).join('');
        STAT_DEFS.forEach((def) => animateCount(document.getElementById(`stat-${def.key}`), stats[def.key] || 0));
        grid.querySelectorAll('[data-link]').forEach((card) => {
            card.addEventListener('click', () => { window.location.href = card.getAttribute('data-link'); });
        });

        document.getElementById('sm-avg-resolution').textContent = stats.avg_resolution_days ? `${stats.avg_resolution_days} days` : 'N/A';
        document.getElementById('sm-tickets-received').textContent = stats.tickets_received ?? '-';
        document.getElementById('sm-tickets-resolved').textContent = stats.tickets_resolved ?? '-';
    } catch (e) {
        grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load dashboard summary.</div>`;
    }

    // Recent tickets needing attention: unassigned or critical/high priority, open, most recent first.
    try {
        const tickets = await db.getMyDashboardTickets({ status: 'all' });
        const attention = tickets
            .filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status))
            .sort((a, b) => {
                const rank = (t) => (t.priority === 'Critical' ? 0 : t.priority === 'High' ? 1 : t.assigned_to ? 3 : 2);
                return rank(a) - rank(b);
            })
            .slice(0, 6);
        renderTicketRows(recentEl, attention, { categories: [], onChanged: () => window.location.reload(), emptyMessage: 'No open tickets need attention right now.' });
    } catch (e) {
        recentEl.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load recent tickets.</td></tr>`;
    }

    if (stats) {
        try {
            await loadChartJs();
            const { textColor, gridColor } = chartTheme();
            Chart.defaults.color = textColor;
            Chart.defaults.font.family = "'Inter', sans-serif";

            const priorityLabels = Object.keys(stats.by_priority || {});
            const priorityColors = { Critical: '#EF4444', High: '#F97316', Medium: '#3B82F6', Low: '#94A3B8' };
            new Chart(document.getElementById('chartPriority'), {
                type: 'doughnut',
                data: {
                    labels: priorityLabels,
                    datasets: [{ data: priorityLabels.map((l) => stats.by_priority[l]), backgroundColor: priorityLabels.map((l) => priorityColors[l] || '#7C3AED') }],
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } },
            });

            const categoryLabels = Object.keys(stats.by_category || {});
            new Chart(document.getElementById('chartCategory'), {
                type: 'bar',
                data: {
                    labels: categoryLabels,
                    datasets: [{ label: 'Tickets', data: categoryLabels.map((l) => stats.by_category[l]), backgroundColor: '#2563EB', borderRadius: 4 }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true } },
                },
            });
        } catch (e) {
            // Charts are a progressive enhancement; stats/table above still work without them.
        }
    }
});

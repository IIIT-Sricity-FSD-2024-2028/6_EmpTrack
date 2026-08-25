// /js/views/support_member/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { animateCount, loadChartJs, chartTheme, showToast } from '../../utils/sa-common.js';
import { renderTicketRows } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    // Assignment (who owns it) and priority (how urgent it is) are separate axes -
    // Unassigned/Critical are scope-wide counts, not filtered to this member's own
    // tickets. Critical has no `link`: there's no single-scope page that matches a
    // scope-wide "everyone's critical tickets" view (My Tickets is always either
    // "mine" or "unassigned"), so it's shown as context only, not a false navigation.
    const STAT_DEFS = [
        { key: 'unassigned_tickets', label: 'Unassigned', icon: 'ph-tray', tone: 'warning', link: 'my-tickets.html?assignment=unassigned' },
        { key: 'my_open_tickets', label: 'My Open Tickets', icon: 'ph-user-focus', tone: 'info', link: 'my-tickets.html' },
        { key: 'critical_tickets', label: 'Critical Tickets', icon: 'ph-fire', tone: 'danger' },
        { key: 'escalated_tickets', label: 'Escalated', icon: 'ph-arrow-up-right', tone: 'purple', link: 'escalated.html' },
        { key: 'resolved_today', label: 'Resolved Today', icon: 'ph-check-circle', tone: 'success', link: 'my-tickets.html?status=RESOLVED&date=today' },
    ];

    const grid = document.getElementById('sm-stats-grid');
    const queueEl = document.getElementById('sm-unassigned-queue');
    const attentionEl = document.getElementById('sm-my-attention');

    let stats = null;
    try {
        stats = await db.getSupportMemberStats();

        grid.innerHTML = STAT_DEFS.map((def) => `
            <div class="card stat-card ${def.link ? 'clickable' : ''}" ${def.link ? `data-link="${def.link}"` : ''}>
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

    const priorityRank = (t) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[t.priority] ?? 4);
    const topByPriority = (tickets) => tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).sort((a, b) => priorityRank(a) - priorityRank(b)).slice(0, 6);

    // Two distinct, clearly-scoped queries - the shared queue of unclaimed work vs.
    // this member's own workload - instead of one ambiguous mixed list.
    try {
        const unassigned = await db.getMyDashboardTickets({ assignedTo: 'unassigned', status: 'all' });
        renderTicketRows(queueEl, topByPriority(unassigned), { categories: [], onChanged: () => window.location.reload(), emptyMessage: 'No unassigned tickets right now.' });
    } catch (e) {
        queueEl.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load the unassigned queue.</td></tr>`;
    }

    try {
        const mine = await db.getMyDashboardTickets({ assignedTo: 'me', status: 'all' });
        renderTicketRows(attentionEl, topByPriority(mine), { categories: [], onChanged: () => window.location.reload(), emptyMessage: 'No open tickets need your attention right now.' });
    } catch (e) {
        attentionEl.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load your tickets.</td></tr>`;
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

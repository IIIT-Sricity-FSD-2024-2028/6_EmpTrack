// /js/views/technical_member/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { animateCount, loadChartJs, chartTheme, escapeHtml, formatDateTime } from '../../utils/sa-common.js';
import { renderIssueRows } from './_board.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const STAT_DEFS = [
        { key: 'assigned_issues', label: 'Assigned Issues', icon: 'ph-bug', tone: 'primary', link: 'assigned-issues.html' },
        { key: 'open_issues', label: 'Open Issues', icon: 'ph-tray', tone: 'info', link: 'assigned-issues.html?status=OPEN' },
        { key: 'in_progress_issues', label: 'In Progress Issues', icon: 'ph-spinner-gap', tone: 'purple', link: 'assigned-issues.html?status=IN_PROGRESS' },
        { key: 'resolved_today', label: 'Resolved Today', icon: 'ph-check-circle', tone: 'success', link: 'issue-history.html' },
        { key: 'high_priority_issues', label: 'High Priority Issues', icon: 'ph-fire', tone: 'danger', link: 'assigned-issues.html?priority=High' },
    ];

    const grid = document.getElementById('tm-stats-grid');
    const recentEl = document.getElementById('tm-recent-issues');
    const updatesEl = document.getElementById('tm-recent-updates');

    let stats = null;
    try {
        stats = await db.getTechnicalMemberStats();

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

        document.getElementById('tm-pending-verification').textContent = stats.pending_verification ?? '-';
        document.getElementById('tm-resolved-total').textContent = stats.resolved_total ?? '-';
        document.getElementById('tm-avg-resolution').textContent = stats.avg_resolution_days ? `${stats.avg_resolution_days} days` : 'N/A';
        document.getElementById('tm-avg-progress').textContent = stats.active_issues ? `${stats.avg_progress}%` : 'N/A';
    } catch (e) {
        grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load dashboard summary.</div>`;
    }

    // Recent assigned issues needing attention: not yet closed, most recently updated first.
    try {
        const issues = await db.getMyTechnicalIssues({ scope: 'active' });
        const recent = issues.slice(0, 6);
        renderIssueRows(recentEl, recent, { onChanged: () => window.location.reload(), emptyMessage: 'No active issues assigned right now.' });
    } catch (e) {
        recentEl.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load recent issues.</td></tr>`;
    }

    // Recent updates: flattened activity feed across every assigned issue.
    try {
        const updates = await db.getTechnicalMemberRecentUpdates(10);
        if (!updates || updates.length === 0) {
            updatesEl.innerHTML = `<div class="empty-state" style="padding:24px;"><i class="ph ph-clock-counter-clockwise"></i> No recent activity yet.</div>`;
        } else {
            const kindIcon = { PROGRESS: 'ph-chart-line-up', NOTE: 'ph-note', ATTACHMENT: 'ph-paperclip', COMMENT: 'ph-chat-circle-dots', VERIFICATION: 'ph-shield-check' };
            updatesEl.innerHTML = updates.map((u) => `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-body">
                        <div class="timeline-title"><i class="ph ${kindIcon[u.kind] || 'ph-info'}"></i> ${escapeHtml(u.ticket_id)}: ${escapeHtml(u.message)}</div>
                        <div class="timeline-sub">${escapeHtml(u.title)}${u.actor ? ' &middot; ' + escapeHtml(u.actor) : ''}</div>
                    </div>
                    <div class="timeline-time">${formatDateTime(u.timestamp)}</div>
                </div>
            `).join('');
        }
    } catch (e) {
        updatesEl.innerHTML = `<div class="error-state" style="padding:24px;"><i class="ph ph-warning-circle"></i> Failed to load recent updates.</div>`;
    }

    if (stats) {
        try {
            await loadChartJs();
            const { textColor, gridColor } = chartTheme();
            Chart.defaults.color = textColor;
            Chart.defaults.font.family = "'Inter', sans-serif";

            const progress = stats.work_progress || [];
            // Palette validated with scripts/validate_palette.js (dataviz skill): #22C55E/#2563EB
            // pass CVD separation and normal-vision floor checks for a 2-series categorical pair.
            new Chart(document.getElementById('chartWorkProgress'), {
                type: 'bar',
                data: {
                    labels: progress.map((p) => p.label),
                    datasets: [
                        { label: 'Issues Resolved', data: progress.map((p) => p.resolved), backgroundColor: '#22C55E', borderRadius: 4 },
                        { label: 'Activity Updates', data: progress.map((p) => p.updates), backgroundColor: '#2563EB', borderRadius: 4 },
                    ],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, beginAtZero: true },
                    },
                },
            });

            // Fixed status order + color pairing validated together (not per-color) so the
            // adjacent-pair CVD check holds regardless of which statuses are present.
            const STATUS_ORDER = [
                { key: 'OPEN', label: 'Open', color: '#3B82F6' },
                { key: 'IN_PROGRESS', label: 'In Progress', color: '#F97316' },
                { key: 'CLOSED', label: 'Closed', color: '#94A3B8' },
                { key: 'RESOLVED', label: 'Resolved', color: '#22C55E' },
                { key: 'ESCALATED', label: 'Escalated', color: '#EF4444' },
            ];
            const present = STATUS_ORDER.filter((s) => (stats.by_status || {})[s.key] > 0);
            new Chart(document.getElementById('chartStatus'), {
                type: 'doughnut',
                data: {
                    labels: present.map((s) => s.label),
                    datasets: [{ data: present.map((s) => stats.by_status[s.key]), backgroundColor: present.map((s) => s.color) }],
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } },
            });
        } catch (e) {
            // Charts are a progressive enhancement; stats/table above still work without them.
        }
    }
});

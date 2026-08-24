// /js/views/platform_admin/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, animateCount, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const STAT_DEFS = [
        { key: 'assigned_companies', label: 'Assigned Companies', icon: 'ph-buildings', tone: 'primary' },
        { key: 'active_companies', label: 'Active Companies', icon: 'ph-check-circle', tone: 'success' },
        { key: 'technical_team_count', label: 'Technical Team Members', icon: 'ph-hard-drives', tone: 'purple' },
        { key: 'support_team_count', label: 'Support Team Members', icon: 'ph-headset', tone: 'info' },
        { key: 'open_technical_issues', label: 'Open Technical Issues', icon: 'ph-bug', tone: 'warning' },
        { key: 'open_support_tickets', label: 'Open Support Tickets', icon: 'ph-ticket', tone: 'warning' },
        { key: 'pending_escalations', label: 'Pending Escalations', icon: 'ph-siren', tone: 'danger' },
    ];

    const grid = document.getElementById('pa-stats-grid');
    const activityEl = document.getElementById('pa-recent-activity');

    try {
        const summary = await db.getPlatformDashboardSummary();

        grid.innerHTML = STAT_DEFS.map((def) => `
            <div class="card stat-card">
                <div class="stat-icon ${def.tone}"><i class="ph-fill ${def.icon}"></i></div>
                <div>
                    <div class="stat-value" id="stat-${def.key}">0</div>
                    <div class="stat-label">${def.label}</div>
                </div>
            </div>
        `).join('');

        STAT_DEFS.forEach((def) => {
            animateCount(document.getElementById(`stat-${def.key}`), summary[def.key] || 0);
        });

        if (!summary.recent_activity || summary.recent_activity.length === 0) {
            activityEl.innerHTML = `<div class="empty-state"><i class="ph ph-list-magnifying-glass"></i> No recorded activity yet.</div>`;
        } else {
            activityEl.innerHTML = summary.recent_activity.map((a) => `
                <div class="comment-item">
                    <span class="comment-author">${escapeHtml(a.action)}</span>
                    <span class="comment-time">${formatDateTime(a.timestamp)}</span>
                    <div class="comment-message">${escapeHtml(a.details || '')}${a.company_name ? ` &middot; ${escapeHtml(a.company_name)}` : ''}</div>
                </div>
            `).join('');
        }
    } catch (e) {
        grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i> Failed to load dashboard summary.</div>`;
    }
});

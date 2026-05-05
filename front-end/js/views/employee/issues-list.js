// /js/views/employee/issues-list.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded
    const issues = await db.getIssuesForUser(user.emp_id);
    
    // Metrics
    const total = issues.length;
    const open = issues.filter(i => i.status === 'Open').length;
    const inProg = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;

    document.getElementById('iss-total').textContent = total;
    document.getElementById('iss-open').textContent = open;
    document.getElementById('iss-prog').textContent = inProg;
    document.getElementById('iss-res').textContent = resolved;

    const getPriorityBadge = (p) => {
        if(p === 'High') return 'badge-high';
        if(p === 'Medium') return 'badge-medium';
        return 'badge-low';
    };

    const getStatusBadge = (s) => {
        if(s === 'In Progress') return 'badge-in-progress';
        if(s === 'Resolved') return 'badge-completed';
        return 'badge-open'; // open matches yellow
    };

    const tbody = document.getElementById('issues-table-body');
    if (tbody) {
        tbody.innerHTML = issues.map(i => `
            <tr>
                <td style="padding: 16px;">
                    <a href="issue-details.html?id=${i.issue_id}" style="color: #3B82F6; font-weight: var(--font-semibold); text-decoration: none;">#${i.issue_id}</a>
                </td>
                <td style="padding: 16px; font-weight: var(--font-medium); max-width: 200px;">
                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.title}</div>
                </td>
                <td style="padding: 16px;">
                    <span class="badge ${getPriorityBadge(i.priority)}" style="padding: 4px 12px; border-radius: var(--radius-full); font-size: 11px;">
                        ${i.priority}
                    </span>
                </td>
                <td style="padding: 16px;">
                    <span class="badge ${getStatusBadge(i.status)}" style="padding: 4px 12px; border-radius: var(--radius-full); font-size: 11px;">
                        ${i.status}
                    </span>
                </td>
                <td style="padding: 16px; color: var(--text-muted);">${i.assigned_to}</td>
                <td style="padding: 16px; color: var(--text-muted); font-size: 12px; max-width: 200px;">
                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.description}</div>
                </td>
                <td style="padding: 16px; text-align:right;">
                    <a href="issue-details.html?id=${i.issue_id}" class="btn btn-purple" style="font-size: 11px; text-decoration: none; padding: 6px 16px; display:inline-flex; align-items:center; gap:5px;">
                        <i class="ph ph-eye"></i> View Details
                    </a>
                </td>
            </tr>
        `).join('');

        if (issues.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No issues recorded.</td></tr>';
        }
    }
});


// /js/views/employee/issues-list.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderIssuesList(container) {
    // Header Logic
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; align-items:center; gap: 10px;">
                <i class="ph ph-warning-circle" style="color:var(--primary-color); font-size: 28px;"></i>
                <span style="font-weight:var(--font-bold);">Issue Reporting</span>
            </div>
            <a href="#raise-issue" class="btn btn-purple" style="text-decoration:none; display:flex; align-items:center; gap:8px; padding: 10px 20px; font-size:var(--text-sm);">
                <i class="ph ph-plus"></i> Raise New Issue
            </a>
        </div>
    `;
    
    const user = auth.getCurrentUser();
    const issues = db.getIssuesForUser(user.emp_id);
    
    // Metrics
    const total = issues.length;
    const open = issues.filter(i => i.status === 'Open').length;
    const inProg = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;

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

    container.innerHTML = `
        <div class="card table-modern" style="padding: 0; overflow:hidden; margin-bottom: var(--spacing-xl);">
            <div style="padding: 20px; border-bottom: 1px solid var(--border-light);">
                <h3 style="margin:0; font-size:var(--text-lg);">Issue Status</h3>
            </div>
            <div class="table-container" style="border-radius: var(--radius-md);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border-color);">
                            <th style="padding: 16px;">Issue ID</th>
                            <th style="padding: 16px;">Title</th>
                            <th style="padding: 16px;">Priority</th>
                            <th style="padding: 16px;">Status</th>
                            <th style="padding: 16px;">Assigned To</th>
                            <th style="padding: 16px;">Remarks</th>
                            <th style="padding: 16px; text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${issues.map(i => `
                            <tr>
                                <td style="padding: 16px;">
                                    <a href="#issue-details/${i.issue_id}" style="color: #3B82F6; font-weight: var(--font-semibold); text-decoration: none;">#${i.issue_id}</a>
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
                                    <a href="#issue-details/${i.issue_id}" class="btn btn-purple" style="font-size: 11px; text-decoration: none; padding: 6px 16px; display:inline-flex; align-items:center; gap:5px;">
                                        <i class="ph ph-eye"></i> View Details
                                    </a>
                                </td>
                            </tr>
                        `).join('')}
                        ${issues.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No issues recorded.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 4 Metrics horizontally -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
            <div class="card" style="text-align:center;">
                <div style="font-size: 32px; font-weight: var(--font-bold); color: var(--text-main);">${total}</div>
                <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Total Issues</div>
            </div>
            <div class="card" style="text-align:center;">
                <div style="font-size: 32px; font-weight: var(--font-bold); color: #3B82F6;">${open}</div>
                <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Open Issues</div>
            </div>
            <div class="card" style="text-align:center;">
                <div style="font-size: 32px; font-weight: var(--font-bold); color: #EA580C;">${inProg}</div>
                <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">In Progress</div>
            </div>
            <div class="card" style="text-align:center;">
                <div style="font-size: 32px; font-weight: var(--font-bold); color: #16A34A;">${resolved}</div>
                <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Resolved</div>
            </div>
        </div>
    `;
}

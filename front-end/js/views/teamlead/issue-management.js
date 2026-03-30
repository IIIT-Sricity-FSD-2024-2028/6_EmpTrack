// /js/views/teamlead/issue-management.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderTeamLeadIssues(container) {
    const user = auth.getCurrentUser();
    
    // Header Logic
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Issue Management</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">Team Lead Portal</span>
            </div>
        </div>
    `;

    // Fetch globally mapped issues
    const allIssues = db.data.issue || [];
    
    // Derived Analytics bounds
    const totalIssues = allIssues.length;
    const openIssues = allIssues.filter(i => i.status === 'Open').length;
    const inProgressIssues = allIssues.filter(i => i.status === 'In Progress').length;
    const resolvedIssues = allIssues.filter(i => i.status === 'Resolved').length;

    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; display:flex; flex-direction:column; gap: 32px; padding-bottom: 40px;">
            
            <!-- SECTION 1: TOP METRIC CARDS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <div class="card" style="padding: 24px; display:flex; align-items:center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-warning-circle" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Total Issues</div>
                        <div style="font-size: 28px; font-weight: var(--font-bold); color: var(--text-main);">${totalIssues}</div>
                    </div>
                </div>
                <div class="card" style="padding: 24px; display:flex; align-items:center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:#FEF3C7; color:#F59E0B; display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-envelope-open" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Open Issues</div>
                        <div style="font-size: 28px; font-weight: var(--font-bold); color: var(--text-main);">${openIssues}</div>
                    </div>
                </div>
                <div class="card" style="padding: 24px; display:flex; align-items:center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:#DBEAFE; color:#2563EB; display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-spinner-gap" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">In Progress</div>
                        <div style="font-size: 28px; font-weight: var(--font-bold); color: var(--text-main);">${inProgressIssues}</div>
                    </div>
                </div>
                <div class="card" style="padding: 24px; display:flex; align-items:center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:#D1FAE5; color:#059669; display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-check-circle" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Resolved</div>
                        <div style="font-size: 28px; font-weight: var(--font-bold); color: var(--text-main);">${resolvedIssues}</div>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: FILTER SECTION -->
            <div class="card" style="padding: 20px; display:flex; gap: 16px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px;">
                    <select class="form-control" style="background-color:#F8FAFC;">
                        <option value="">Filter by Status mapping...</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
                <div style="flex:1; min-width:200px;">
                    <select class="form-control" style="background-color:#F8FAFC;">
                        <option value="">Filter by Priority bounds...</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <div style="flex:1; min-width:200px;">
                    <input type="text" class="form-control" placeholder="Search by Employee..." style="background-color:#F8FAFC;">
                </div>
                <div style="flex:1; min-width:200px;">
                    <input type="text" class="form-control" placeholder="Search by Assigned To..." style="background-color:#F8FAFC;">
                </div>
            </div>

            <!-- SECTION 3: TEAM ISSUES TABLE -->
            <div class="card table-modern" style="padding: 0; overflow:hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-light);">
                    <h3 style="margin:0; font-size:var(--text-lg);">Team Issues</h3>
                </div>
                <div class="table-container" style="border-radius: var(--radius-md);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border-color);">
                                <th style="padding: 16px;">Issue Info</th>
                                <th style="padding: 16px;">Employee</th>
                                <th style="padding: 16px;">Task</th>
                                <th style="padding: 16px;">Priority</th>
                                <th style="padding: 16px;">Status</th>
                                <th style="padding: 16px;">Assigned To</th>
                                <th style="padding: 16px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allIssues.reverse().map(i => {
                                // Priority styling
                                let priBadge = 'badge-low';
                                if(i.priority === 'High') priBadge = 'badge-high';
                                if(i.priority === 'Medium') priBadge = 'badge-medium';

                                // Status styling
                                let statBadge = 'badge-open';
                                let statIcon = 'ph-envelope-open';
                                if(i.status === 'In Progress') { statBadge = 'badge-info'; statIcon = 'ph-spinner-gap'; }
                                if(i.status === 'Resolved') { statBadge = 'badge-completed'; statIcon = 'ph-check-circle'; }

                                // Emp resolution mapping
                                const refEmp = db.getUserById(i.emp_id);
                                const empStr = refEmp ? refEmp.emp_name : i.emp_id;

                                // Extract Task mapping
                                const taskStr = i.related_task ? `<a href="#tasks" style="color:var(--primary-color); text-decoration:none; font-weight:var(--font-medium);">${i.related_task}</a>` : '<span style="color:var(--text-muted);">-</span>';

                                // State boolean logic resolving Disabled button formatting natively.
                                const isResolved = i.status === 'Resolved';

                                return `
                                <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
                                    <td style="padding: 16px; min-width: 250px;">
                                        <a href="#issue-details/${i.issue_id}" style="color:var(--primary-color); font-weight:var(--font-bold); text-decoration:none; font-size:13px;">${i.issue_id}</a>
                                        <div style="font-weight:var(--font-semibold); margin: 4px 0; color:#334155;">${i.title}</div>
                                        <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${i.type}</div>
                                    </td>
                                    <td style="padding: 16px; font-weight:var(--font-medium); color:#475569;">${empStr}</td>
                                    <td style="padding: 16px;">${taskStr}</td>
                                    <td style="padding: 16px;">
                                        <span class="badge ${priBadge}">${i.priority}</span>
                                    </td>
                                    <td style="padding: 16px;">
                                        <span class="badge ${statBadge}" style="display:inline-flex; align-items:center; gap:4px;">
                                            <i class="ph ${statIcon}"></i> ${i.status}
                                        </span>
                                    </td>
                                    <td style="padding: 16px; font-size:13px; color:#475569;">${i.assigned_to}</td>
                                    <td style="padding: 16px;">
                                        ${isResolved ? `
                                            <span style="color:var(--text-muted); font-size:13px; font-style:italic;"><i class="ph-fill ph-check-circle"></i> Completed</span>
                                        ` : `
                                            <div style="display:flex; flex-direction:column; gap: 8px;">
                                                <a href="#assign-issue/${i.issue_id}" class="btn" style="background-color:#DBEAFE; color:#1D4ED8; border-radius:var(--radius-full); padding:6px 16px; text-decoration:none; font-size:12px; font-weight:var(--font-bold); box-shadow:0 1px 2px rgba(0,0,0,0.05); text-align:center;">Assign</a>
                                                <a href="#resolve-issue/${i.issue_id}" class="btn" style="background-color:#D1FAE5; color:#047857; border-radius:var(--radius-full); padding:6px 16px; text-decoration:none; font-size:12px; font-weight:var(--font-bold); box-shadow:0 1px 2px rgba(0,0,0,0.05); text-align:center;">Resolve</a>
                                            </div>
                                        `}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                            ${allIssues.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No issues found.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;
}

// /js/views/teamlead/issue-management.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    // Fetch globally mapped issues
    const allIssues = db.data.issue || [];
    
    const totalIssues = allIssues.length;
    const openIssues = allIssues.filter(i => i.status === 'Open').length;
    const inProgressIssues = allIssues.filter(i => i.status === 'In Progress').length;
    const resolvedIssues = allIssues.filter(i => i.status === 'Resolved').length;

    document.getElementById('stat-total').textContent = totalIssues;
    document.getElementById('stat-open').textContent = openIssues;
    document.getElementById('stat-progress').textContent = inProgressIssues;
    document.getElementById('stat-resolved').textContent = resolvedIssues;

    const renderTable = (issuesObj) => {
        const tbody = document.getElementById('issues-table-body');
        if (!tbody) return;

        tbody.innerHTML = issuesObj.map(i => {
            let priBadge = 'badge-low';
            if(i.priority === 'High') priBadge = 'badge-high';
            if(i.priority === 'Medium') priBadge = 'badge-medium';

            let statBadge = 'badge-open';
            let statIcon = 'ph-envelope-open';
            if(i.status === 'In Progress') { statBadge = 'badge-info'; statIcon = 'ph-spinner-gap'; }
            if(i.status === 'Resolved') { statBadge = 'badge-completed'; statIcon = 'ph-check-circle'; }

            const refEmp = await db.getUserById(i.emp_id);
            const empStr = refEmp ? refEmp.emp_name : i.emp_id;

            const taskStr = i.related_task ? `<a href="tasks.html" style="color:var(--primary-color); text-decoration:none; font-weight:var(--font-medium);">${i.related_task}</a>` : '<span style="color:var(--text-muted);">-</span>';
            const isResolved = i.status === 'Resolved';

            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
                <td style="padding: 16px; min-width: 250px;">
                    <span style="color:var(--primary-color); font-weight:var(--font-bold); text-decoration:none; font-size:13px;">${i.issue_id}</span>
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
                            <a href="assign-issue.html?id=${i.issue_id}" class="btn" style="background-color:#DBEAFE; color:#1D4ED8; border-radius:var(--radius-full); padding:6px 16px; text-decoration:none; font-size:12px; font-weight:var(--font-bold); box-shadow:0 1px 2px rgba(0,0,0,0.05); text-align:center;">Assign</a>
                            <a href="resolve-issue.html?id=${i.issue_id}" class="btn" style="background-color:#D1FAE5; color:#047857; border-radius:var(--radius-full); padding:6px 16px; text-decoration:none; font-size:12px; font-weight:var(--font-bold); box-shadow:0 1px 2px rgba(0,0,0,0.05); text-align:center;">Resolve</a>
                        </div>
                    `}
                </td>
            </tr>
            `;
        }).join('');

        if (issuesObj.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No issues found.</td></tr>';
        }
    };

    const performFilter = () => {
        const filterStatus = document.getElementById('filter-status').value;
        const filterPriority = document.getElementById('filter-priority').value;
        const searchEmp = document.getElementById('search-emp').value.toLowerCase();
        const searchAssigned = document.getElementById('search-assigned').value.toLowerCase();

        let filtered = [...allIssues];
        filtered.reverse();

        if (filterStatus) filtered = filtered.filter(i => i.status === filterStatus);
        if (filterPriority) filtered = filtered.filter(i => i.priority === filterPriority);
        if (searchEmp) {
            filtered = filtered.filter(i => {
                const refEmp = await db.getUserById(i.emp_id);
                const empStr = refEmp ? refEmp.emp_name.toLowerCase() : i.emp_id.toLowerCase();
                return empStr.includes(searchEmp);
            });
        }
        if (searchAssigned) filtered = filtered.filter(i => i.assigned_to.toLowerCase().includes(searchAssigned));

        renderTable(filtered);
    };

    document.getElementById('filter-status').addEventListener('change', performFilter);
    document.getElementById('filter-priority').addEventListener('change', performFilter);
    document.getElementById('search-emp').addEventListener('input', performFilter);
    document.getElementById('search-assigned').addEventListener('input', performFilter);

    // Initial render
    performFilter();
});

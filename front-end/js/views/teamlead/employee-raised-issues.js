// /js/views/teamlead/employee-raised-issues.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const renderIssues = () => {
        const issues = db.getIssuesForManager(user.emp_id);
        
        let highPriority = 0;
        let pending = 0;
        let inProgress = 0;
        
        const issuesData = issues.map(i => {
            const emp = db.getUserById(i.emp_id);
            const empName = emp ? emp.emp_name.split(' (')[0] : 'Employee';
            
            if(i.priority === 'High') highPriority++;
            if(i.status === 'Open' || i.status === 'Pending') pending++;
            else if(i.status === 'In Progress') inProgress++;

            let priorityColor = 'var(--secondary-color)';
            if (i.priority === 'High') priorityColor = 'var(--danger-color)';
            else if (i.priority === 'Medium') priorityColor = 'var(--warning-color)';
            
            let statusColor = '#3b82f6';
            if (i.status === 'Open' || i.status === 'Pending') statusColor = 'var(--warning-color)';
            else if (i.status === 'Resolved' || i.status === 'Closed') statusColor = 'var(--secondary-color)';

            return {
                id: i.issue_id,
                emp: empName,
                title: i.title,
                type: i.type,
                priority: i.priority,
                status: i.status,
                date: i.raised_date,
                priorityColor,
                statusColor
            };
        }).reverse();

        const statTotal = document.getElementById('stat-total');
        if (statTotal) statTotal.textContent = issuesData.length;
        
        const statHigh = document.getElementById('stat-high');
        if (statHigh) statHigh.textContent = highPriority;
        
        const statPending = document.getElementById('stat-pending');
        if (statPending) statPending.textContent = pending;
        
        const statProgress = document.getElementById('stat-progress');
        if (statProgress) statProgress.textContent = inProgress;

        const tbody = document.getElementById('raised-issues-body');
        if (tbody) {
            tbody.innerHTML = issuesData.map(issue => `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);">
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                        ${issue.emp.charAt(0)}
                    </div>
                    <span style="font-weight: var(--font-medium);">${issue.emp}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted);">${issue.id}</td>
                <td style="padding: var(--spacing-md); font-weight: var(--font-medium);">${issue.title}</td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px; background-color: var(--border-light); color: var(--text-main); font-weight: var(--font-medium);">${issue.type}</span>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; background-color: ${issue.priorityColor}20; color: ${issue.priorityColor}; font-weight: var(--font-bold);">${issue.priority}</span>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; background-color: ${issue.statusColor}20; color: ${issue.statusColor}; font-weight: var(--font-bold);">${issue.status}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${issue.date}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; gap: var(--spacing-sm);">
                        <button class="action-btn resolve-btn" data-id="${issue.id}" title="Resolve Issue" style="padding: 6px 12px; border: none; background-color: rgba(16, 185, 129, 0.1); color: var(--secondary-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-check-circle"></i>
                        </button>
                        <button class="action-btn details-btn" title="View Details" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-eye"></i>
                        </button>
                        <button class="action-btn escalate-hr-btn" data-id="${issue.id}" title="Escalate to HR" style="padding: 6px 12px; border: none; background-color: rgba(249, 115, 22, 0.1); color: var(--accent-orange); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                            <i class="ph ph-siren"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

            // Bind resolve buttons
            const resolveBtns = document.querySelectorAll('.resolve-btn');
            resolveBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.resolve-btn');
                    if (btnEl) {
                        const id = btnEl.getAttribute('data-id');
                        db.updateIssue(id, { status: 'Resolved' });
                        renderIssues();
                    }
                });
            });

            // Re-bind dynamically injected buttons
            const escalateBtns = document.querySelectorAll('.escalate-hr-btn');
            escalateBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.escalate-hr-btn');
                    if (btnEl) {
                        const id = btnEl.getAttribute('data-id');
                        localStorage.setItem('escalate_draft_id', id);
                    }
                    window.location.href = 'escalate-to-hr.html';
                });
            });
        }
    };
    
    renderIssues();

    // Navigation Events
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'escalations.html';
        });
    }

    const navLowProd = document.getElementById('nav-low-productivity');
    if (navLowProd) {
        navLowProd.addEventListener('click', () => {
            window.location.href = 'escalations.html';
        });
    }

    const globalEscalateBtn = document.getElementById('global-escalate-btn');
    if (globalEscalateBtn) {
        globalEscalateBtn.addEventListener('click', () => {
            window.location.href = 'escalate-to-hr.html';
        });
    }

});

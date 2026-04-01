// /js/views/teamlead/escalations.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const renderEscalations = () => {
        const teamTasks = db.getAllTasksForManager(user.emp_id);
        const lateOrActiveTasks = teamTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'NOT_STARTED');
        
        const mockTasks = lateOrActiveTasks.map(t => {
            const emp = db.getUserById(t.assigned_to);
            const empName = emp ? emp.emp_name.split(' (')[0] : 'Employee';
            const est = parseInt(t.est_hours || 40);
            const spent = parseInt(t.hours_spent || (est * Math.random()));
            const progress = t.progress_percentage || Math.floor(Math.random() * 80);
            
            return {
                emp: empName,
                id: t.task_id,
                title: t.task_title,
                progress: progress,
                est: est + 'h',
                spent: spent + 'h',
                reason: progress < 50 && spent > est / 2 ? 'Falling behind estimation' : 'Pending completion'
            };
        });

        const mockStats = {
            total: teamTasks.length,
            avgDelay: 'N/A',
            employees: Object.keys(teamTasks.reduce((acc, t) => { acc[t.assigned_to] = true; return acc; }, {})).length,
            avgProgress: (mockTasks.reduce((acc, t) => acc + t.progress, 0) / (mockTasks.length || 1)).toFixed(0) + '%'
        };

        const elStatTotal = document.getElementById('stat-total');
        if (elStatTotal) elStatTotal.textContent = mockStats.total;
        const elStatDelay = document.getElementById('stat-delay');
        if (elStatDelay) elStatDelay.textContent = mockStats.avgDelay;
        const elStatEmp = document.getElementById('stat-emp');
        if (elStatEmp) elStatEmp.textContent = mockStats.employees;
        const elStatProgress = document.getElementById('stat-progress');
        if (elStatProgress) elStatProgress.textContent = mockStats.avgProgress;

        const tbody = document.getElementById('escalations-table-body');
        if (tbody) {
            tbody.innerHTML = mockTasks.map(task => `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);">
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                        ${task.emp.charAt(0)}
                    </div>
                    <span style="font-weight: var(--font-medium);">${task.emp}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted);">${task.id}</td>
                <td style="padding: var(--spacing-md);">${task.title}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; align-items:center; gap:var(--spacing-sm);">
                        <div style="flex:1; height: 8px; background-color: var(--border-light); border-radius: var(--radius-full); overflow:hidden;">
                            <div style="width: ${task.progress}%; height: 100%; background-color: var(--danger-color); border-radius: var(--radius-full);"></div>
                        </div>
                        <span style="font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--danger-color);">${task.progress}%</span>
                    </div>
                </td>
                <td style="padding: var(--spacing-md);">${task.spent} / ${task.est}</td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${task.reason}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; gap: var(--spacing-sm);">
                        <button class="action-btn warning-btn" title="Send Warning" style="padding: 6px 12px; border: none; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-warning"></i>
                        </button>
                        <button class="action-btn extend-btn" title="Extend Deadline" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-calendar-plus"></i>
                        </button>
                        <button class="action-btn reassign-btn" title="Reassign Task" style="padding: 6px 12px; border: none; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-users-three"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
            if (mockTasks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No lagging tasks currently active.</td></tr>';
            }
        }
    };
    
    renderEscalations();

    // Event Listeners for Navigation logic
    const navEmployeeIssues = document.getElementById('nav-employee-issues');
    if (navEmployeeIssues) {
        navEmployeeIssues.addEventListener('click', () => {
            window.location.href = 'employee-raised-issues.html';
        });
    }

    const globalEscalateBtn = document.getElementById('global-escalate-btn');
    if (globalEscalateBtn) {
        globalEscalateBtn.addEventListener('click', () => {
            window.location.href = 'escalate-to-hr.html';
        });
    }
});

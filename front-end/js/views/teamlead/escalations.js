// /js/views/teamlead/escalations.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const mockStats = {
        total: 12,
        avgDelay: '2.5 Days',
        employees: 8,
        avgProgress: '42%'
    };

    const mockTasks = [
        { emp: 'John Smith', id: 'T-045', title: 'Payment Gateway Integration', progress: 40, est: '40h', spent: '45h', reason: 'Delayed API access' },
        { emp: 'Mike Davis', id: 'T-052', title: 'Database Migration', progress: 35, est: '24h', spent: '30h', reason: 'Unexpected schema errors' },
        { emp: 'Emma Wilson', id: 'T-061', title: 'User Onboarding Flow', progress: 48, est: '32h', spent: '35h', reason: 'Design revisions pending' },
        { emp: 'Sarah Johnson', id: 'T-068', title: 'Email Templates Update', progress: 20, est: '16h', spent: '18h', reason: 'Content missing' }
    ];

    document.getElementById('stat-total').textContent = mockStats.total;
    document.getElementById('stat-delay').textContent = mockStats.avgDelay;
    document.getElementById('stat-emp').textContent = mockStats.employees;
    document.getElementById('stat-progress').textContent = mockStats.avgProgress;

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
    }

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

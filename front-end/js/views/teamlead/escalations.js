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
                emp_id: t.assigned_to,
                warning_sent: t.warning_sent,
                deadline: t.deadline,
                desc: t.task_description,
                status: t.status,
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
                        <button class="action-btn details-btn" data-id="${task.id}" data-emp="${task.emp}" data-empid="${task.emp_id}" title="View Details" style="padding: 6px 12px; border: none; background-color: rgba(14, 165, 233, 0.1); color: rgb(14, 165, 233); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-info"></i>
                        </button>
                        <button class="action-btn warning-btn" data-id="${task.id}" data-emp="${task.emp}" data-empid="${task.emp_id}" title="Send Warning" style="padding: 6px 12px; border: none; background-color: ${task.warning_sent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${task.warning_sent ? 'var(--danger-color)' : 'var(--warning-color)'}; border-radius: var(--radius-md); cursor: ${task.warning_sent ? 'not-allowed' : 'pointer'}; transition: all 0.2s ease;" ${task.warning_sent ? 'disabled' : ''}>
                            <i class="ph ${task.warning_sent ? 'ph-warning-octagon' : 'ph-warning'}"></i>
                        </button>
                        <button class="action-btn extend-btn" data-id="${task.id}" data-emp="${task.emp}" data-empid="${task.emp_id}" title="Extend Deadline" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
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
        attachTableListeners();
    };

    function attachTableListeners() {
        const modal = document.getElementById('action-modal');
        const mTitle = document.getElementById('modal-title');
        const mBody = document.getElementById('modal-body');
        const mCancel = document.getElementById('modal-cancel-btn');
        const mConfirm = document.getElementById('modal-confirm-btn');

        if(!modal) return;

        const closeModal = () => { modal.style.display = 'none'; };
        mCancel.onclick = closeModal;
        document.getElementById('modal-close-btn').onclick = closeModal;

        // Details
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tId = e.currentTarget.dataset.id;
                const task = db.data.task.find(t => t.task_id === tId);
                if(!task) return;

                const emp = db.getUserById(task.assigned_to);
                
                mTitle.textContent = "Task Details";
                mBody.innerHTML = `
                    <p style="margin:0;"><strong>Task:</strong> ${task.task_title}</p>
                    <p style="margin:0;"><strong>Description:</strong> ${task.task_description}</p>
                    <p style="margin:0;"><strong>Assigned To:</strong> ${emp ? emp.emp_name : 'Unknown'}</p>
                    <p style="margin:0;"><strong>Deadline:</strong> ${task.deadline}</p>
                    <p style="margin:0;"><strong>Status:</strong> ${task.status.replace('_', ' ')}</p>
                    <p style="margin:0;"><strong>Warning Sent:</strong> ${task.warning_sent ? '<span style="color:var(--danger-color)">Yes</span>' : 'No'}</p>
                `;
                mConfirm.style.display = 'none';
                mCancel.textContent = "Close";
                modal.style.display = 'flex';
            });
        });

        // Warning
        document.querySelectorAll('.warning-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tId = e.currentTarget.dataset.id;
                const eId = e.currentTarget.dataset.empid;
                const tName = e.currentTarget.dataset.emp;

                mTitle.textContent = "Send Warning";
                mBody.innerHTML = `<p>Are you sure you want to send a warning to <strong>${tName}</strong> for task <strong>${tId}</strong>?</p>`;
                mConfirm.style.display = 'block';
                mConfirm.textContent = 'Send Warning';
                mConfirm.style.background = 'var(--danger-color)';
                mCancel.textContent = "Cancel";

                mConfirm.onclick = () => {
                    db.createNotification(eId, `Your task ${tId} has been escalated. Take immediate action.`, 'warning');
                    db.updateTask(tId, { warning_sent: true });
                    alert('Warning sent successfully to ' + tName);
                    closeModal();
                    renderEscalations();
                };

                modal.style.display = 'flex';
            });
        });

        // Extend
        document.querySelectorAll('.extend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tId = e.currentTarget.dataset.id;
                const eId = e.currentTarget.dataset.empid;
                const task = db.data.task.find(t => t.task_id === tId);

                mTitle.textContent = "Extend Deadline";
                mBody.innerHTML = `
                    <p>Select a new deadline for task <strong>${tId}</strong>.</p>
                    <input type="date" id="new-deadline-input" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; width:100%; box-sizing:border-box; outline:none; font-family:var(--font-family);" value="${task ? task.deadline : ''}">
                `;
                mConfirm.style.display = 'block';
                mConfirm.textContent = 'Extend Deadline';
                mConfirm.style.background = '#3b82f6';
                mCancel.textContent = "Cancel";

                mConfirm.onclick = () => {
                    const input = document.getElementById('new-deadline-input');
                    const newDeadline = input.value;
                    if(!newDeadline) {
                        alert("Please select a valid date.");
                        return;
                    }
                    if(task && new Date(newDeadline) <= new Date(task.deadline)) {
                        alert("New deadline must be after the current deadline (" + task.deadline + ").");
                        return;
                    }

                    db.updateTask(tId, { deadline: newDeadline });
                    db.createNotification(eId, `Your task deadline for ${tId} has been extended to ${newDeadline}.`, 'info');
                    alert('Deadline extended successfully.');
                    closeModal();
                    renderEscalations();
                };

                modal.style.display = 'flex';
            });
        });
    }
    
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

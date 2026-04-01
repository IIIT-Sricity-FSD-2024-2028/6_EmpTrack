// /js/views/teamlead/escalations.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    let tasks = db.getAllTasksForManager(user.emp_id);

    const updateStats = () => {
        let total = tasks.length;
        let delayedTasks = tasks.filter(t => new Date(t.deadline) < new Date());
        let delayCount = delayedTasks.length;
        let empCount = new Set(tasks.map(t => t.assigned_to)).size;
        let avgProg = tasks.length > 0 ? (tasks.reduce((acc, t) => acc + t.progress_percentage, 0) / tasks.length).toFixed(0) : 0;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-delay').textContent = delayCount + ' Tasks';
        document.getElementById('stat-emp').textContent = empCount;
        document.getElementById('stat-progress').textContent = avgProg + '%';
    };

    const tbody = document.getElementById('escalations-table-body');
    
    // Toast notification
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.style.background = type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#10b981';
        toast.style.color = '#fff';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = 'var(--radius-md)';
        toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '8px';
        toast.style.fontSize = '14px';
        toast.style.animation = 'fade-in 0.3s ease-out';
        
        let icon = type === 'warning' ? 'ph-warning' : type === 'error' ? 'ph-x-circle' : 'ph-check-circle';
        toast.innerHTML = `<i class="ph ${icon}" style="font-size:1.2rem;"></i> ${message}`;
        
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    };

    const renderTable = () => {
        if (!tbody) return;
        
        tasks = db.getAllTasksForManager(user.emp_id); // Refresh
        updateStats();

        tbody.innerHTML = tasks.map(task => {
            const empUser = db.getUserById(task.assigned_to);
            const empName = empUser ? empUser.emp_name : 'Unknown';
            return `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);" id="row-${task.task_id}">
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                        ${empName.charAt(0)}
                    </div>
                    <div>
                        <span class="employee-name" style="font-weight: var(--font-medium);">${empName}</span>
                        ${task.warning_sent ? '<div style="font-size:10px; color:var(--warning-color); font-weight:bold;">Warning Sent</div>' : ''}
                    </div>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted);">${task.task_id}</td>
                <td style="padding: var(--spacing-md);">${task.task_title}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; align-items:center; gap:var(--spacing-sm);">
                        <div style="flex:1; height: 8px; background-color: var(--border-light); border-radius: var(--radius-full); overflow:hidden;">
                            <div style="width: ${task.progress_percentage}%; height: 100%; background-color: ${task.progress_percentage < 50 ? 'var(--danger-color)' : 'var(--secondary-color)'}; border-radius: var(--radius-full);"></div>
                        </div>
                        <span style="font-size: var(--text-sm); font-weight: var(--font-bold); color: ${task.progress_percentage < 50 ? 'var(--danger-color)' : 'var(--secondary-color)'};">${task.progress_percentage}%</span>
                    </div>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-main); font-size: var(--text-sm);">
                    Deadline: ${task.deadline}
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm); max-width:150px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${task.task_description}">${task.task_description}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; gap: var(--spacing-sm);">
                        <button class="action-btn details-btn" data-id="${task.task_id}" title="View Details" style="padding: 6px 12px; border: none; background-color: rgba(107, 114, 128, 0.1); color: var(--text-main); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-eye"></i>
                        </button>
                        <button class="action-btn warning-btn" data-id="${task.task_id}" title="Send Warning" style="padding: 6px 12px; border: none; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; ${task.warning_sent ? 'opacity:0.5; pointer-events:none;' : ''}">
                            <i class="ph ph-warning"></i>
                        </button>
                        <button class="action-btn extend-btn" data-id="${task.task_id}" title="Extend Deadline" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-calendar-plus"></i>
                        </button>
                        <button class="action-btn reassign-btn" data-id="${task.task_id}" title="Reassign Task" style="padding: 6px 12px; border: none; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-users-three"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    };

    renderTable();

    // Event Delegation for Table Buttons
    if (tbody) {
        tbody.addEventListener('click', function (e) {
            const btn = e.target.closest('button');
            if (!btn) return;

            const id = btn.dataset.id;
            const task = tasks.find(t => t.task_id === id);
            const employeeUser = task ? db.getUserById(task.assigned_to) : null;

            if (btn.classList.contains('details-btn')) {
                const modal = document.getElementById('task-details-modal');
                const content = document.getElementById('task-details-content');
                if (modal && content && task) {
                    content.innerHTML = `
                        <p><strong>Task ID:</strong> ${task.task_id}</p>
                        <p><strong>Title:</strong> ${task.task_title}</p>
                        <p><strong>Assigned To:</strong> ${employeeUser ? employeeUser.emp_name : task.assigned_to}</p>
                        <p><strong>Status:</strong> ${task.status}</p>
                        <p><strong>Deadline:</strong> ${task.deadline}</p>
                        <p><strong>Progress:</strong> ${task.progress_percentage}%</p>
                        <p><strong>Description:</strong> ${task.task_description}</p>
                        <p><strong>Warning Sent:</strong> ${task.warning_sent ? 'Yes' : 'No'}</p>
                    `;
                    modal.style.display = 'flex';
                }
            }

            if (btn.classList.contains('warning-btn')) {
                if (confirm(`Are you sure you want to send a warning for task ${id}?`)) {
                    // Update Task
                    db.updateTaskDetails(id, { warning_sent: true });
                    // Send notification to employee
                    db.createNotification(task.assigned_to, `Your task "${task.task_title}" has been escalated. Take immediate action.`, 'warning');
                    showToast('Warning sent successfully!', 'warning');
                    renderTable();
                    highlightRow(id);
                }
            }

            if (btn.classList.contains('extend-btn')) {
                const d = prompt(`Enter new deadline (YYYY-MM-DD)\nCurrent: ${task.deadline}`);
                if (d) {
                    if (new Date(d) > new Date(task.deadline)) {
                        db.updateTaskDetails(id, { deadline: d });
                        db.createNotification(task.assigned_to, `Your task "${task.task_title}" deadline has been extended to ${d}.`, 'info');
                        showToast('Deadline extended successfully!');
                        renderTable();
                        highlightRow(id);
                    } else {
                        alert("Invalid date: New deadline must be after the current deadline.");
                    }
                }
            }

            if (btn.classList.contains('reassign-btn')) {
                // Show prompt of employees under this manager
                const team = db.getUsersByManager(user.emp_id);
                let teamStr = team.map(m => `${m.emp_id}: ${m.emp_name}`).join('\n');
                const newEmpId = prompt(`Enter Employee ID to reassign:\n\n${teamStr}`);
                if(newEmpId) {
                    const validEmp = team.find(m => m.emp_id === newEmpId);
                    if(validEmp) {
                        db.updateTaskDetails(id, { assigned_to: newEmpId });
                        db.createNotification(newEmpId, `You have been assigned a new escalated task: "${task.task_title}".`, 'info');
                        showToast(`Task reassigned to ${validEmp.emp_name}.`);
                        renderTable();
                        highlightRow(id);
                    } else {
                        alert("Invalid Employee ID or they are not on your team.");
                    }
                }
            }
        });
    }

    const highlightRow = (id) => {
        const row = document.getElementById(`row-${id}`);
        if(row) {
            row.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 1000);
        }
    }

    // Modal Close
    const closeBtn = document.getElementById('close-details-btn');
    const detailsModal = document.getElementById('task-details-modal');
    if (closeBtn && detailsModal) {
        closeBtn.addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) detailsModal.style.display = 'none';
        });
    }

    // Navigation Events
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

// /js/views/teamlead/escalations.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

<<<<<<< HEAD
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
=======
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
                < tr style = "border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);" >
>>>>>>> f6cb44aae91333eb5fe31f0a0678255269e72ec3
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
                        <button class="action-btn details-btn" data-id="${task.id}" data-emp="${task.emp}" data-empid="${task.emp_id}" title="View Details" style="padding: 6px 12px; border: none; background-color: rgba(14, 165, 233, 0.1); color: rgb(14, 165, 233); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-info"></i>
                        </button>
                        <button class="action-btn warning-btn" data-id="${task.id}" data-emp="${task.emp}" data-empid="${task.emp_id}" title="Send Warning" style="padding: 6px 12px; border: none; background-color: ${task.warning_sent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${task.warning_sent ? 'var(--danger-color)' : 'var(--warning-color)'}; border-radius: var(--radius-md); cursor: ${task.warning_sent ? 'not-allowed' : 'pointer'}; transition: all 0.2s ease;" ${task.warning_sent ? 'disabled' : ''}>
                            <i class="ph ${task.warning_sent ? 'ph-warning-octagon' : 'ph-warning'}"></i>
                        </button>
                        <button class="action-btn extend-btn" data-id="${task.id}" data-emp="${task.emp}" data-empid="${task.emp_id}" title="Extend Deadline" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-calendar-plus"></i>
                        </button>
                        <button class="action-btn reassign-btn" data-id="${task.task_id}" title="Reassign Task" style="padding: 6px 12px; border: none; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-users-three"></i>
                        </button>
                    </div>
                </td>
            </tr >
<<<<<<< HEAD
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
        < p > <strong>Task ID:</strong> ${ task.task_id }</p >
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
                if (confirm(`Are you sure you want to send a warning for task ${ id } ? `)) {
                    // Update Task
                    db.updateTaskDetails(id, { warning_sent: true });
                    // Send notification to employee
                    db.createNotification(task.assigned_to, `Your task "${task.task_title}" has been escalated.Take immediate action.`, 'warning');
                    showToast('Warning sent successfully!', 'warning');
                    renderTable();
                    highlightRow(id);
                }
            }

            if (btn.classList.contains('extend-btn')) {
                const d = prompt(`Enter new deadline(YYYY - MM - DD) \nCurrent: ${ task.deadline } `);
                if (d) {
                    if (new Date(d) > new Date(task.deadline)) {
                        db.updateTaskDetails(id, { deadline: d });
                        db.createNotification(task.assigned_to, `Your task "${task.task_title}" deadline has been extended to ${ d }.`, 'info');
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
                let teamStr = team.map(m => `${ m.emp_id }: ${ m.emp_name } `).join('\n');
                const newEmpId = prompt(`Enter Employee ID to reassign: \n\n${ teamStr } `);
                if(newEmpId) {
                    const validEmp = team.find(m => m.emp_id === newEmpId);
                    if(validEmp) {
                        db.updateTaskDetails(id, { assigned_to: newEmpId });
                        db.createNotification(newEmpId, `You have been assigned a new escalated task: "${task.task_title}".`, 'info');
                        showToast(`Task reassigned to ${ validEmp.emp_name }.`);
                        renderTable();
                        highlightRow(id);
                    } else {
                        alert("Invalid Employee ID or they are not on your team.");
                    }
                }
            }
        });
    }
=======
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

    if (!modal) return;

    const closeModal = () => { modal.style.display = 'none'; };
    mCancel.onclick = closeModal;
    document.getElementById('modal-close-btn').onclick = closeModal;

    // Details
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tId = e.currentTarget.dataset.id;
            const task = db.data.task.find(t => t.task_id === tId);
            if (!task) return;

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
                if (!newDeadline) {
                    alert("Please select a valid date.");
                    return;
                }
                if (task && new Date(newDeadline) <= new Date(task.deadline)) {
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
>>>>>>> f6cb44aae91333eb5fe31f0a0678255269e72ec3

const highlightRow = (id) => {
    const row = document.getElementById(`row-${id}`);
    if (row) {
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

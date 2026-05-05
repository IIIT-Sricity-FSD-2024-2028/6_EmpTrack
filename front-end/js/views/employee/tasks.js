// /js/views/employee/tasks.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js

    const dbTasks = await db.getTasksForUser(user.emp_id).catch(() => []);
    
    // Load from local assignedTasks
    const assignedTasksRaw = JSON.parse(localStorage.getItem('assignedTasks') || '[]');
    let userAssignedTasks = assignedTasksRaw; // Render ALL assigned tasks for now, do not filter

    const localMapped = userAssignedTasks.map(t => ({
        task_id: "T-" + t.id.toString().substring(t.id.toString().length - 4),
        task_title: t.title,
        task_description: t.description,
        deadline: t.dueDate,
        est_hours: t.hours || 0,
        status: t.status || 'ASSIGNED'
    }));

    const tasks = [...dbTasks, ...localMapped];
    console.log("Assigned tasks from storage", tasks);
    
    const getBadgeClass = (status) => {
        const s = status.toUpperCase();
        if(s === 'IN PROGRESS' || s === 'IN_PROGRESS') return 'badge-in-progress';
        if(s === 'COMPLETED') return 'badge-completed';
        return 'badge-not-started';
    };

    const tbody = document.getElementById('tasks-table-body');
    if (tbody) {
        tbody.innerHTML = tasks.map(t => `
            <tr>
                <td style="padding: 16px;">
                    <a href="update-task.html?id=${t.task_id}" style="color: #3B82F6; font-weight: var(--font-semibold); text-decoration: none;">#${t.task_id}</a>
                </td>
                <td style="padding: 16px; font-weight: var(--font-medium);">${t.task_title}</td>
                <td style="padding: 16px; color: var(--text-muted); max-width: 250px;">
                    <div style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${t.task_description}
                    </div>
                </td>
                <td style="padding: 16px;">${t.deadline}</td>
                <td style="padding: 16px; color: var(--text-muted);">${t.est_hours || 0}h</td>
                <td style="padding: 16px;">
                    <span class="badge ${getBadgeClass(t.status)}" style="padding: 4px 12px; border-radius: var(--radius-full); font-size: 11px; white-space:nowrap;">
                        ${t.status.replace('_', ' ')}
                    </span>
                </td>
                <td style="padding: 16px; text-align:right;">
                    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                        <a href="update-task.html?id=${t.task_id}" class="btn btn-orange" style="font-size: 11px; text-decoration: none; display:inline-block; text-align:center;">
                            Update
                        </a>
                        <a href="work-logs.html?id=${t.task_id}" class="btn btn-purple" style="font-size: 11px; text-decoration: none; display:inline-block; text-align:center; padding: 6px 16px;">
                            Work on Task
                        </a>
                    </div>
                </td>
            </tr>
        `).join('');
        
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No tasks currently assigned.</td></tr>';
        }
    }
});


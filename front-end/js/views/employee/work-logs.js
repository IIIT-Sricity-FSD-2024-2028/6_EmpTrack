// /js/views/employee/work-logs.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const form = document.getElementById('work-log-form');
    const taskDrop = document.getElementById('wl_task_id');
    const tbody = document.getElementById('work-logs-body');

    // 1. Fetch available tasks for dropdown
    const tasks = (await db.getTasksForUser(user.emp_id)).filter(t => t.status !== 'COMPLETED');
    
    // 2. Populate Dropdown dynamically
    if (taskDrop) {
        taskDrop.innerHTML = '<option value="" disabled selected>Select assigned task</option>' + 
            tasks.map(t => `<option value="${t.task_id}" data-title="${t.task_title}">#${t.task_id} - ${t.task_title}</option>`).join('');
            
        // Pre-select task ID if passed via URL (e.g., ?id=T-045) from the Action button on tasks.html
        const urlParams = new URLSearchParams(window.location.search);
        const taskIdParam = urlParams.get('id');
        if (taskIdParam) {
            taskDrop.value = taskIdParam;
        }
    }
    // ønce start time and end time are filled, we have to calculate hours spend like end time - start time
    const hoursSpent = document.getElementById('hours-spent-wl');
    const startTime = document.getElementById('wl_start');
    const endTime = document.getElementById('wl_end');
    startTime.addEventListener('change', async () => {
        const start = new Date(startTime.value);
        const end = new Date(endTime.value);
        const diff = end - start;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        hoursSpent.value = hours;
    });
    endTime.addEventListener('change', async () => {
        const start = new Date(startTime.value);
        const end = new Date(endTime.value);
        const diff = end - start;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        hoursSpent.value = hours;
    });

    // 3. Render Table
    async function renderTable() {
        const logs = await db.getWorkLogsForUser(user.emp_id);
        
        let totalLogsMonth = logs.length;
        let totalWeekHours = logs.reduce((sum, l) => sum + parseInt(l.hours_spent || 0), 0);
        let avgHours = (totalWeekHours / (totalLogsMonth || 1)).toFixed(1);

        const elHrs = document.getElementById('wl-hrs');
        const elTotal = document.getElementById('wl-total');
        const elAvg = document.getElementById('wl-avg');
        
        if (elHrs) elHrs.textContent = totalWeekHours;
        if (elTotal) elTotal.textContent = totalLogsMonth;
        if (elAvg) elAvg.textContent = avgHours;

        if (!tbody) return;
        tbody.innerHTML = logs.reverse().map(l => `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
                <td style="padding: 16px;">
                    <a href="#work-logs" style="color: #3B82F6; font-weight: var(--font-semibold); text-decoration: none;">#${l.worklog_id}</a>
                </td>
                <td style="padding: 16px;">
                    <span style="color: var(--text-main); font-weight: var(--font-medium);">#${l.task_id}</span>
                </td>
                <td style="padding: 16px; min-width: 150px; white-space: normal; line-height:1.4;">
                    ${l.task_title || "Generic Task"}
                </td>
                <td style="padding: 16px; color: var(--text-muted); font-size:12px;">${l.start_time.replace('T', ' ')}</td>
                <td style="padding: 16px; color: var(--text-muted); font-size:12px;">${l.end_time.replace('T', ' ')}</td>
                <td style="padding: 16px; color: var(--text-muted); font-size: 13px; max-width: 300px; line-height:1.4;">
                    ${l.description}
                </td>
            </tr>
        `).join('');

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--text-muted);">No logs found.</td></tr>';
        }
    }

    // 4. Handle Form Submit with validation
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Feature: form validity API checks "required", "min", "max" fields
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const selectedOption = taskDrop.options[taskDrop.selectedIndex];
            const startTime = document.getElementById('wl_start').value;
            const endTime = document.getElementById('wl_end').value;

            // Custom validation: End time must be strictly after start time
            if (new Date(endTime) <= new Date(startTime)) {
                alert("Error: Work End Time must be strictly greater than Work Start Time.");
                return;
            }

            // Save via the database
            await db.createWorkLog({
                emp_id: user.emp_id,
                task_id: taskDrop.value,
                task_title: selectedOption.getAttribute('data-title'),
                hours_spent: Number(document.getElementById('hours-spent-wl').value),
                start_time: startTime,
                end_time: endTime,
                description: document.getElementById('wl_desc').value
            });
            
            // Render Notification
            const toast = document.createElement('div');
            toast.textContent = "Work log successfully logged!";
            toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#10B981; color:white; padding:12px 24px; border-radius:var(--radius-md); font-weight:var(--font-medium); box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999;";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

            // Clean Form & Re-render Data 
            form.reset();
            
            // Opt to retain the query parameter if one was set natively
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('id')) {
                taskDrop.value = urlParams.get('id');
            }

            renderTable();
        });
    }

    // Initialize Default States
    renderTable();
});


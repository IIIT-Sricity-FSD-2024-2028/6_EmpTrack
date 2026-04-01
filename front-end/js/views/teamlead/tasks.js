// /js/views/teamlead/tasks.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    /* -------------------------------
       FRONTEND STATE
    --------------------------------*/
    const getTasksFromDB = () => {
        return db.getAllTasksForManager(user.emp_id).map(t => {
            const emp = db.getUserById(t.assigned_to) || {emp_name: 'Employee'};
            let status = 'Assigned';
            if (t.status === 'IN_PROGRESS') status = 'In Progress';
            if (t.status === 'COMPLETED') status = 'Completed';
            
            return {
                id: t.task_id,
                employee: emp.emp_name.split(' (')[0],
                title: t.task_title,
                description: t.task_description,
                hours: t.est_hours || 40,
                deadline: t.deadline,
                status: status
            };
        });
    };

    let filterSearch = '';
    let filterStatus = 'All';
    let sortBy = 'Deadline';

    /* -------------------------------
       TOAST NOTIFICATION
    --------------------------------*/
    const showToast = (message, type = 'success') => {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position:fixed;
                bottom:20px;
                right:20px;
                display:flex;
                flex-direction:column;
                gap:10px;
                z-index:9999;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background:${type === 'success' ? '#16A34A' : '#DC2626'};
            color:white;
            padding:12px 20px;
            border-radius:8px;
            font-weight:500;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.innerHTML = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    /* -------------------------------
       SUMMARY STATS
    --------------------------------*/
    const countTasks = () => {
        const all = getTasksFromDB();
        const total = all.length;
        const active = all.filter(t => t.status === 'In Progress').length;
        const completed = all.filter(t => t.status === 'Completed').length;
        const pending = Math.max(0, 8 - total % 8);
        return { total, active, completed, pending };
    };

    const renderSummaryCards = () => {
        const stats = countTasks();
        const html = `
        <div class="ts-stat-card">
            <i class="ph-fill ph-briefcase stat-icon" style="color:var(--tl-primary);"></i>
            <h4>Total Assigned</h4>
            <p>${stats.total}</p>
        </div>
        <div class="ts-stat-card">
            <i class="ph-fill ph-rocket stat-icon" style="color:var(--tl-warning);"></i>
            <h4>Active This Week</h4>
            <p>${stats.active}</p>
        </div>
        <div class="ts-stat-card">
            <i class="ph-fill ph-check-circle stat-icon" style="color:var(--tl-success);"></i>
            <h4>Completed</h4>
            <p>${stats.completed}</p>
        </div>
        <div class="ts-stat-card">
            <i class="ph-fill ph-hourglass-high stat-icon" style="color:var(--tl-info);"></i>
            <h4>Pending Assignment</h4>
            <p>${stats.pending}</p>
        </div>
        `;
        const container = document.getElementById("ts-summary-container");
        if (container) container.innerHTML = html;
    };

    /* -------------------------------
       BADGE COLOR
    --------------------------------*/
    const getBadgeClass = (status) => {
        if (status === 'Assigned') return 'badge-blue';
        if (status === 'In Progress') return 'badge-orange';
        if (status === 'Completed') return 'badge-green';
        return '';
    };

    /* -------------------------------
       FILTER + SORT
    --------------------------------*/
    const getFilteredTasks = () => {
        let filtered = getTasksFromDB().filter(task => {
            const searchMatch = task.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
                                task.employee.toLowerCase().includes(filterSearch.toLowerCase());
            const statusMatch = filterStatus === "All" || task.status === filterStatus;
            return searchMatch && statusMatch;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'Hours') return b.hours - a.hours;
            if (sortBy === 'Deadline') return new Date(a.deadline) - new Date(b.deadline);
            return 0;
        });
        return filtered;
    };

    /* -------------------------------
       TABLE RENDER
    --------------------------------*/
    const attachTableEvents = () => {
        const tbody = document.getElementById("ts-table-body");
        tbody.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", e => {
                const row = e.target.closest("tr");
                const id = row.dataset.id;
                if (!confirm("Delete this task?")) return;
                db.deleteTask(id);
                renderTaskTable();
                renderSummaryCards();
                showToast("Task deleted", "danger");
            });
        });
    };

    const renderTaskTable = () => {
        const tbody = document.getElementById("ts-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";
        
        const tasks = getFilteredTasks();
        if (tasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">No tasks assigned yet</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.dataset.id = task.id;
            tr.innerHTML = `
            <td><strong>${task.id}</strong></td>
            <td>${task.employee}</td>
            <td class="td-title">${task.title}</td>
            <td class="td-desc">${task.description}</td>
            <td class="td-hours">${task.hours}h</td>
            <td class="td-deadline">${task.deadline}</td>
            <td class="td-status">
                <span class="${getBadgeClass(task.status)}">${task.status}</span>
            </td>
            <td>
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </td>
            `;
            tbody.appendChild(tr);
        });

        attachTableEvents();
    };

    /* -------------------------------
       INITIALIZATION
    --------------------------------*/
    renderSummaryCards();
    renderTaskTable();

    /* -------------------------------
       FORM SUBMIT
    --------------------------------*/
    const assignForm = document.getElementById("assign-task-form");
    if (assignForm) {
        assignForm.addEventListener("submit", e => {
            e.preventDefault();
            const empNameStr = document.getElementById("form-emp").value;
            // The value gives name, need to find emp_id.
            // Simplified: let's try to match it first.
            const empObj = db.getUsersByManager(user.emp_id).find(e => e.emp_name.includes(empNameStr)) || {emp_id: "EM001"};
            
            const title = document.getElementById("form-title").value;
            const desc = document.getElementById("form-desc").value;
            const hours = document.getElementById("form-hours").value;
            const deadline = document.getElementById("form-deadline").value;

            db.createTask({
                task_title: title,
                allocation_id: "W" + Math.floor(100+Math.random()*900),
                assigned_to: empObj.emp_id,
                task_description: desc,
                priority: "HIGH",
                deadline: deadline,
                est_hours: parseInt(hours) || 40
            });

            renderTaskTable();
            renderSummaryCards();
            e.target.reset();
            showToast("Task Assigned Successfully");
        });
    }
});
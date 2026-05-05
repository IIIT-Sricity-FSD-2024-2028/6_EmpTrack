// /js/views/teamlead/tasks.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    /* -------------------------------
       FRONTEND STATE
    --------------------------------*/
    let stateTasks = [
        { id: "T-045", employee: "John Doe", title: "Payment Gateway", description: "Integrate Stripe", hours: 40, deadline: "2026-03-20", status: "Assigned" },
        { id: "T-046", employee: "Sarah Johnson", title: "Profile Enhancement", description: "Add validation", hours: 24, deadline: "2026-03-15", status: "Assigned" },
        { id: "T-047", employee: "Mike Davis", title: "Performance Optimization", description: "Optimize queries", hours: 32, deadline: "2026-03-18", status: "In Progress" },
        { id: "T-048", employee: "Emma Wilson", title: "Mobile Design", description: "Responsive UI", hours: 48, deadline: "2026-03-25", status: "Assigned" }
    ];

    const loadLocalTasks = async () => {
        const local = await db.getAllTasksForManager(user.emp_id).catch(() => []);
        if (local && local.length > 0) {
            const mapped = local.map(t => ({
                id: t.task_id,
                employee: t.employee_name || t.assigned_to,
                title: t.task_title,
                description: t.task_description,
                hours: t.est_hours,
                deadline: t.deadline,
                status: (t.status || 'Assigned').replace('_', ' ')
            })).filter(t => !stateTasks.find(s => s.id === t.id));
            stateTasks = [...mapped, ...stateTasks];
            renderTaskTable();
            renderSummaryCards();
        }
    };
    loadLocalTasks();

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
        const total = stateTasks.length;
        const active = stateTasks.filter(t => t.status === 'In Progress').length;
        const completed = stateTasks.filter(t => t.status === 'Completed').length;
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
        let filtered = stateTasks.filter(task => {
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
        
        tbody.querySelectorAll(".btn-edit").forEach(btn => {
            btn.addEventListener("click", e => {
                const row = e.target.closest("tr");
                const id = row.dataset.id;
                const task = stateTasks.find(t => t.id === id);
                if (!task) return;

                document.getElementById('edit-task-id').value = task.id;
                
                // Set employee dropdown
                const empSelect = document.getElementById('edit-emp');
                let empFound = false;
                Array.from(empSelect.options).forEach(opt => {
                    if (opt.value === task.employee || opt.text === task.employee || task.employee.includes(opt.text)) {
                        opt.selected = true;
                        empFound = true;
                    }
                });
                if (!empFound && task.employee) {
                    const newOpt = document.createElement('option');
                    newOpt.text = task.employee;
                    newOpt.value = task.employee;
                    newOpt.selected = true;
                    empSelect.add(newOpt);
                }

                document.getElementById('edit-title').value = task.title;
                document.getElementById('edit-desc').value = task.description;
                document.getElementById('edit-hours').value = task.hours;
                document.getElementById('edit-deadline').value = task.deadline || '';
                
                const statusMap = { 'Assigned': 'Assigned', 'In Progress': 'In Progress', 'Completed': 'Completed' };
                document.getElementById('edit-status').value = statusMap[task.status] || 'Assigned';

                document.getElementById('edit-task-modal').classList.add('active');
            });
        });

        tbody.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", e => {
                const row = e.target.closest("tr");
                const id = row.dataset.id;
                if (!confirm("Delete this task?")) return;
                stateTasks = stateTasks.filter(t => t.id !== id);
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
            const emp = document.getElementById("form-emp").value;
            const title = document.getElementById("form-title").value;
            const desc = document.getElementById("form-desc").value;
            const hours = document.getElementById("form-hours").value;
            const deadline = document.getElementById("form-deadline").value;

            console.log("Task assigned clicked");
            const newTask = {
                id: Date.now(),
                title: title,
                description: desc,
                assignedTo: emp,
                dueDate: deadline,
                priority: "Medium",
                status: "Assigned",
                hours: parseInt(hours)
            };

            const existingTasks = JSON.parse(localStorage.getItem("assignedTasks") || "[]");
            existingTasks.push(newTask);
            localStorage.setItem("assignedTasks", JSON.stringify(existingTasks));

            // Map back to stateTasks format just for local UI rendering
            const uiTask = {
                id: "T-" + Math.floor(100 + Math.random() * 900),
                employee: emp,
                title: title,
                description: desc,
                hours: parseInt(hours),
                deadline: deadline,
                status: "Assigned"
            };

            stateTasks.unshift(uiTask);
            renderTaskTable();
            renderSummaryCards();
            e.target.reset();
            showToast("Task Assigned Successfully");
        });
    }

    /* -------------------------------
       EDIT MODAL LOGIC
    --------------------------------*/
    const editModal = document.getElementById('edit-task-modal');
    const closeBtn = document.getElementById('close-edit-modal');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-task-form');

    const closeModal = () => {
        editModal.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Close on overlay click
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeModal();
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-task-id').value;
            const task = stateTasks.find(t => t.id === id);
            
            if (!task) return;

            task.employee = document.getElementById('edit-emp').value;
            task.title = document.getElementById('edit-title').value;
            task.description = document.getElementById('edit-desc').value;
            task.hours = parseInt(document.getElementById('edit-hours').value);
            task.deadline = document.getElementById('edit-deadline').value;
            task.status = document.getElementById('edit-status').value;

            // Optional: call API if it exists on backend
            // db.updateTaskDetails(id, task).catch(console.error);

            renderTaskTable();
            renderSummaryCards();
            closeModal();
            showToast("Task updated successfully");
        });
    }
});

// /js/views/teamlead/tasks.js

export function renderTeamLeadTasks(container) {

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Assign Tasks';

    /* -------------------------------
       FRONTEND STATE
    --------------------------------*/
    let stateTasks = [
        { id: "T-045", employee: "John Dev", title: "Payment Gateway", description: "Integrate Stripe", hours: 40, deadline: "2026-03-20", status: "Assigned" },
        { id: "T-046", employee: "Sarah Johnson", title: "Profile Enhancement", description: "Add validation", hours: 24, deadline: "2026-03-15", status: "Assigned" },
        { id: "T-047", employee: "Mike Davis", title: "Performance Optimization", description: "Optimize queries", hours: 32, deadline: "2026-03-18", status: "In Progress" },
        { id: "T-048", employee: "Emma Wilson", title: "Mobile Design", description: "Responsive UI", hours: 48, deadline: "2026-03-25", status: "Assigned" }
    ];

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
            <h4>Total Assigned</h4>
            <p>${stats.total}</p>
        </div>

        <div class="ts-stat-card">
            <h4>In Progress</h4>
            <p>${stats.active}</p>
        </div>

        <div class="ts-stat-card">
            <h4>Completed</h4>
            <p>${stats.completed}</p>
        </div>

        <div class="ts-stat-card">
            <h4>Pending</h4>
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

            const searchMatch =
                task.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
                task.employee.toLowerCase().includes(filterSearch.toLowerCase());

            const statusMatch =
                filterStatus === "All" || task.status === filterStatus;

            return searchMatch && statusMatch;
        });

        filtered.sort((a, b) => {

            if (sortBy === 'Hours') return b.hours - a.hours;

            if (sortBy === 'Deadline')
                return new Date(a.deadline) - new Date(b.deadline);

            return 0;
        });

        return filtered;
    };

    /* -------------------------------
       TABLE RENDER
    --------------------------------*/
    const renderTaskTable = () => {

        const tbody = document.getElementById("ts-table-body");

        if (!tbody) return;

        tbody.innerHTML = "";

        const tasks = getFilteredTasks();

        if (tasks.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;">
                    No tasks assigned yet
                </td>
            </tr>
            `;

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
       DELETE / EDIT EVENTS
    --------------------------------*/
    const attachTableEvents = () => {

        const tbody = document.getElementById("ts-table-body");

        /* DELETE */

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

    /* -------------------------------
       PAGE HTML
    --------------------------------*/
    container.innerHTML = `

    <div class="ts-assign-wrapper">

        <div id="ts-summary-container" class="ts-summary-grid"></div>

        <div class="ts-layout-stack">

            <!-- ASSIGN TASK FORM -->

            <div class="ts-card">

                <h3>Assign New Task</h3>

                <form id="assign-task-form">

                    <select id="form-emp" required>
                        <option value="">Select Employee</option>
                        <option>John Dev</option>
                        <option>Sarah Johnson</option>
                        <option>Mike Davis</option>
                        <option>Emma Wilson</option>
                    </select>

                    <input id="form-title" placeholder="Task Title" required>

                    <textarea id="form-desc" placeholder="Description"></textarea>

                    <input type="number" id="form-hours" placeholder="Hours" required>

                    <input type="date" id="form-deadline" required>

                    <button type="submit">Assign Task</button>

                </form>

            </div>

            <!-- TASK TABLE -->

            <div class="ts-card">

                <h3>Assigned Task List</h3>

                <table class="ts-table">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Employee</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Hours</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody id="ts-table-body"></tbody>

                </table>

            </div>

        </div>

    </div>
    `;

    /* -------------------------------
       TOOLBAR EVENTS
    --------------------------------*/
    renderSummaryCards();
    renderTaskTable();

    /* -------------------------------
       FORM SUBMIT
    --------------------------------*/
    document
        .getElementById("assign-task-form")
        .addEventListener("submit", e => {

            e.preventDefault();

            const emp = document.getElementById("form-emp").value;
            const title = document.getElementById("form-title").value;
            const desc = document.getElementById("form-desc").value;
            const hours = document.getElementById("form-hours").value;
            const deadline = document.getElementById("form-deadline").value;

            const newTask = {

                id: "T-" + Math.floor(100 + Math.random() * 900),

                employee: emp,
                title: title,
                description: desc,
                hours: parseInt(hours),
                deadline: deadline,
                status: "Assigned"
            };

            /* IMPORTANT
               Adds task to bottom */
            stateTasks.push(newTask);

            renderTaskTable();
            renderSummaryCards();

            e.target.reset();

            showToast("Task Assigned Successfully");
        });

}
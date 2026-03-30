// /js/views/hr/employee-management.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderHREmployeeManagement(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Employee Management</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
        </div>
    `;

    // Dummy Data
    const employees = [
        { id: 'EMP-001', name: 'John Smith', email: 'john.smith@company.com', dept: 'Engineering', role: 'Senior Developer', joinDate: '2024-01-15', status: 'Active' },
        { id: 'EMP-002', name: 'Sarah Johnson', email: 'sarah.j@company.com', dept: 'Engineering', role: 'Full Stack Developer', joinDate: '2024-02-10', status: 'Active' },
        { id: 'EMP-003', name: 'Mike Davis', email: 'mike.d@company.com', dept: 'Engineering', role: 'Backend Developer', joinDate: '2024-03-01', status: 'Inactive' },
        { id: 'EMP-004', name: 'Emma Wilson', email: 'emma.w@company.com', dept: 'Engineering', role: 'QA Engineer', joinDate: '2024-03-20', status: 'On Leave' },
        { id: 'EMP-005', name: 'James Brown', email: 'james.b@company.com', dept: 'Engineering', role: 'Junior Developer', joinDate: '2024-04-05', status: 'Active' },
        { id: 'EMP-006', name: 'Alice Cooper', email: 'alice.c@company.com', dept: 'Design', role: 'UI/UX Designer', joinDate: '2023-10-12', status: 'Active' },
        { id: 'EMP-007', name: 'Bob Wilson', email: 'bob.w@company.com', dept: 'Marketing', role: 'Marketing Lead', joinDate: '2023-11-20', status: 'Active' },
        { id: 'EMP-008', name: 'Carol Smith', email: 'carol.s@company.com', dept: 'Sales', role: 'Sales Executive', joinDate: '2024-01-05', status: 'On Leave' }
    ];

    // Stats
    const total = 156;
    const active = 148;
    const onLeave = 6;
    const newThisMonth = 5;

    container.innerHTML = `
        <style>
            .hr-emp-manage {
                --emp-primary: #7C3AED;
                --emp-success: #22C55E;
                --emp-warning: #F97316;
                --emp-info: #3B82F6;
                --emp-inactive: #9CA3AF;
                animation: hrFadeIn 0.3s ease-out forwards;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            @keyframes hrFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .hr-emp-manage .card {
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                box-shadow: var(--shadow-sm);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .hr-emp-manage .card:hover { box-shadow: var(--shadow-md); }

            /* Filter Bar */
            .hr-emp-manage .filter-bar {
                padding: 16px 20px;
                display: flex;
                gap: 16px;
                align-items: center;
                flex-wrap: wrap;
                justify-content: space-between;
            }

            .hr-emp-manage .search-wrap {
                position: relative;
                flex-grow: 1;
                max-width: 400px;
            }

            .hr-emp-manage .search-wrap i {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-muted);
            }

            .hr-emp-manage .search-input {
                width: 100%;
                padding: 10px 16px 10px 40px;
                background: var(--bg-main);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-main);
                font-size: 14px;
                transition: 0.2s;
                outline: none;
            }

            .hr-emp-manage .search-input:focus {
                border-color: var(--emp-primary);
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
            }

            .hr-emp-manage .filters-wrap {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .hr-emp-manage .filter-select {
                padding: 10px 16px;
                background: var(--bg-main);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-main);
                font-size: 14px;
                outline: none;
                cursor: pointer;
            }

            .hr-emp-manage .filter-select:focus { border-color: var(--emp-primary); }

            .hr-emp-manage .btn-clear {
                background: transparent;
                border: 1px solid var(--border-color);
                color: var(--text-muted);
                padding: 10px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: 0.2s;
            }
            .hr-emp-manage .btn-clear:hover { background: var(--bg-main); color: var(--text-main); }

            /* Table */
            .hr-emp-manage .table-container {
                overflow-x: auto;
                border-radius: 12px;
            }

            .hr-emp-manage table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                min-width: 800px;
            }

            .hr-emp-manage th {
                background: var(--bg-main);
                padding: 16px 24px;
                font-size: 12px;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 1px solid var(--border-color);
            }

            .hr-emp-manage td {
                padding: 16px 24px;
                border-bottom: 1px solid var(--border-color);
                color: var(--text-main);
                font-size: 14px;
            }

            .hr-emp-manage tbody tr { transition: background 0.2s; }
            .hr-emp-manage tbody tr:hover { background: var(--bg-main); }
            .hr-emp-manage tbody tr:last-child td { border-bottom: none; }

            .hr-emp-manage .emp-id-link {
                color: var(--emp-info);
                text-decoration: none;
                font-weight: 600;
                transition: 0.2s;
            }
            .hr-emp-manage .emp-id-link:hover { text-decoration: underline; color: var(--emp-primary); }

            .hr-emp-manage .emp-name-col { display: flex; flex-direction: column; gap: 4px; }
            .hr-emp-manage .emp-name { font-weight: 600; }
            .hr-emp-manage .emp-email { font-size: 12px; color: var(--text-muted); }

            .hr-emp-manage .badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                position: relative;
                cursor: help;
            }
            .hr-emp-manage .badge.active { background: rgba(34, 197, 94, 0.15); color: var(--emp-success); }
            .hr-emp-manage .badge.inactive { background: var(--border-color); color: var(--emp-inactive); }
            .hr-emp-manage .badge.leave { background: rgba(249, 115, 22, 0.15); color: var(--emp-warning); }

            /* Tooltip */
            .hr-emp-manage .badge::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 125%; left: 50%;
                transform: translateX(-50%);
                background: #111827; color: #fff;
                padding: 4px 8px; border-radius: 4px;
                font-size: 11px; white-space: nowrap;
                opacity: 0; pointer-events: none; transition: 0.2s;
            }
            .hr-emp-manage .badge:hover::after { opacity: 1; }

            /* Loading Anim */
            .hr-emp-manage .loader-row td { padding: 40px; text-align: center; color: var(--text-muted); }
            .hr-emp-manage .spinner {
                display: inline-block;
                width: 24px; height: 24px;
                border: 3px solid var(--border-color);
                border-top-color: var(--emp-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 8px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }

            /* Summary Cards (Bottom) */
            .hr-emp-manage .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
            }

            .hr-emp-manage .summary-card {
                padding: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: 8px;
                transition: 0.3s;
            }
            .hr-emp-manage .summary-card:hover { transform: translateY(-4px); }

            .hr-emp-manage .sc-val { font-size: 32px; font-weight: 700; color: var(--text-main); line-height: 1; }
            .hr-emp-manage .sc-label { font-size: 13px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

            .hr-emp-manage .sc-active .sc-val { color: var(--emp-success); }
            .hr-emp-manage .sc-leave .sc-val { color: var(--emp-warning); }
            .hr-emp-manage .sc-new .sc-val { color: var(--emp-info); }

            @media (max-width: 768px) {
                .hr-emp-manage .filter-bar { flex-direction: column; align-items: stretch; }
                .hr-emp-manage .search-wrap { max-width: 100%; }
                .hr-emp-manage .filters-wrap { flex-wrap: wrap; }
                .hr-emp-manage .filter-select { flex-grow: 1; }
            }
        </style>

        <div class="hr-emp-manage">
            
            <!-- Filters -->
            <div class="card filter-bar">
                <div class="search-wrap">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="empSearch" class="search-input" placeholder="Search employees by name, email, or ID...">
                </div>
                <div class="filters-wrap">
                    <select id="empDeptFilter" class="filter-select">
                        <option value="all">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                    </select>
                    <select id="empStatusFilter" class="filter-select">
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                    </select>
                    <button class="btn-clear" id="empClearSort"><i class="ph ph-x"></i> Clear</button>
                </div>
            </div>

            <!-- Table -->
            <div class="card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Join Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="empTableBody">
                        <tr class="loader-row" id="loaderRow">
                            <td colspan="6">
                                <div class="spinner"></div>
                                <div>Loading directory...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Summary Cards Bottom -->
            <div class="summary-grid">
                <div class="card summary-card sc-total">
                    <div class="sc-val" data-val="${total}">0</div>
                    <div class="sc-label">Total Employees</div>
                </div>
                <div class="card summary-card sc-active">
                    <div class="sc-val" data-val="${active}">0</div>
                    <div class="sc-label">Active</div>
                </div>
                <div class="card summary-card sc-leave">
                    <div class="sc-val" data-val="${onLeave}">0</div>
                    <div class="sc-label">On Leave</div>
                </div>
                <div class="card summary-card sc-new">
                    <div class="sc-val" data-val="${newThisMonth}">0</div>
                    <div class="sc-label">New This Month</div>
                </div>
            </div>

        </div>
    `;

    const tableBody = container.querySelector('#empTableBody');
    const searchInput = container.querySelector('#empSearch');
    const deptFilter = container.querySelector('#empDeptFilter');
    const statusFilter = container.querySelector('#empStatusFilter');
    const clearBtn = container.querySelector('#empClearSort');

    // Make ID clicks global
    window.handleEmpClick = (id) => {
        alert('Clicked Employee ID: ' + id + '\\n\\n(In a full app, this would open the employee profile model or route.)');
    };

    function renderRows(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color:var(--text-muted);">No employees found matching your criteria.</td></tr>`;
            return;
        }

        data.forEach(emp => {
            let badgeCls = emp.status === 'Active' ? 'active' : emp.status === 'Inactive' ? 'inactive' : 'leave';
            let tooltip = emp.status === 'Active' ? 'Currently working' : emp.status === 'Inactive' ? 'No longer active' : 'Currently on approved leave';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="javascript:void(0)" class="emp-id-link" onclick="handleEmpClick('${emp.id}')">${emp.id}</a></td>
                <td>
                    <div class="emp-name-col">
                        <span class="emp-name">${emp.name}</span>
                        <span class="emp-email">${emp.email}</span>
                    </div>
                </td>
                <td>${emp.dept}</td>
                <td>${emp.role}</td>
                <td>${emp.joinDate}</td>
                <td><span class="badge ${badgeCls}" data-tooltip="${tooltip}">${emp.status}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const dept = deptFilter.value;
        const status = statusFilter.value;

        const filtered = employees.filter(e => {
            const mText = e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || e.id.toLowerCase().includes(query);
            const mDept = dept === 'all' || e.dept === dept;
            const mStatus = status === 'all' || e.status === status;
            return mText && mDept && mStatus;
        });

        renderRows(filtered);
    }

    // Bind events
    searchInput.addEventListener('input', applyFilters);
    deptFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        deptFilter.value = 'all';
        statusFilter.value = 'all';
        applyFilters();
    });

    // Animate summary stats
    const counters = container.querySelectorAll('.sc-val');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-val');
        const duration = 1000;
        const step = Math.max(1, Math.ceil(target / (duration / 16)));
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.innerText = target;
                clearInterval(timer);
            } else {
                counter.innerText = current;
            }
        }, 16);
    });

    // Simulate load time for bonus feature
    setTimeout(() => {
        renderRows(employees);
    }, 600);
}

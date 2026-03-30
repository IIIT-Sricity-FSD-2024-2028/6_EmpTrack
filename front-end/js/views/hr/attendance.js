// /js/views/hr/attendance.js
export function renderHRAttendance(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Attendance Management</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
        </div>
    `;

    // Dummy JSON Data mapping
    const employees = [
        { id: 'EMP-101', name: 'Alice Smith', dept: 'engineering', checkIn: '09:00 AM', hours: 8, estHours: 8, status: 'present' },
        { id: 'EMP-102', name: 'Bob Johnson', dept: 'marketing', checkIn: '09:15 AM', hours: 4, estHours: 8, status: 'late' },
        { id: 'EMP-103', name: 'Charlie Brown', dept: 'design', checkIn: '-', hours: 0, estHours: 8, status: 'absent' },
        { id: 'EMP-104', name: 'Diana Rigg', dept: 'hr', checkIn: '-', hours: 0, estHours: 8, status: 'leave' },
        { id: 'EMP-105', name: 'Ethan Hunt', dept: 'engineering', checkIn: '08:45 AM', hours: 9, estHours: 8, status: 'present' },
        { id: 'EMP-106', name: 'Fiona Gallagher', dept: 'marketing', checkIn: '10:00 AM', hours: 3.5, estHours: 8, status: 'late' },
        { id: 'EMP-107', name: 'George Lucas', dept: 'design', checkIn: '09:05 AM', hours: 7.5, estHours: 8, status: 'present' },
        { id: 'EMP-108', name: 'Hannah Abbott', dept: 'engineering', checkIn: '09:02 AM', hours: 6, estHours: 8, status: 'present' }
    ];

    container.innerHTML = `
        <style>
            .hr-attendance-dashboard {
                --hr-primary: #7C3AED;
                --hr-success: #22C55E;
                --hr-danger: #EF4444;
                --hr-warning: #F97316;
                --hr-info: #3B82F6;
                font-family: 'Inter', sans-serif;
            }

            .hr-attendance-dashboard .summary-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }

            .hr-attendance-dashboard .data-card {
                background-color: var(--bg-surface);
                border-radius: var(--radius-lg);
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                box-shadow: var(--shadow-sm);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid var(--border-color);
                position: relative;
                overflow: hidden;
            }

            .hr-attendance-dashboard .data-card:hover {
                transform: translateY(-5px);
                box-shadow: var(--shadow-md);
            }

            .hr-attendance-dashboard .card-icon {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: transform 0.3s ease;
            }

            .hr-attendance-dashboard .data-card:hover .card-icon {
                transform: scale(1.1);
            }

            .hr-attendance-dashboard .card-blue .card-icon { background-color: rgba(59, 130, 246, 0.1); color: var(--hr-info); }
            .hr-attendance-dashboard .card-green .card-icon { background-color: rgba(34, 197, 94, 0.1); color: var(--hr-success); }
            .hr-attendance-dashboard .card-red .card-icon { background-color: rgba(239, 68, 68, 0.1); color: var(--hr-danger); }
            .hr-attendance-dashboard .card-orange .card-icon { background-color: rgba(249, 115, 22, 0.1); color: var(--hr-warning); }
            .hr-attendance-dashboard .card-purple .card-icon { background-color: rgba(124, 58, 237, 0.1); color: var(--hr-primary); }

            .hr-attendance-dashboard .filters-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                gap: 16px;
                flex-wrap: wrap;
            }

            .hr-attendance-dashboard .search-bar {
                position: relative;
                flex-grow: 1;
                max-width: 320px;
            }

            .hr-attendance-dashboard .search-bar i {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-muted);
            }

            .hr-attendance-dashboard .search-bar input {
                width: 100%;
                padding: 12px 16px 12px 40px;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                outline: none;
                font-size: 14px;
                transition: 0.2s ease;
                background-color: var(--bg-surface);
                color: var(--text-main);
            }

            .hr-attendance-dashboard .search-bar input:focus {
                border-color: var(--hr-primary);
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
            }

            .hr-attendance-dashboard .filter-dropdowns {
                display: flex;
                gap: 12px;
            }

            .hr-attendance-dashboard .filter-dropdowns select, 
            .hr-attendance-dashboard .filter-dropdowns input {
                padding: 10px 16px;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                background-color: var(--bg-surface);
                color: var(--text-main);
                font-size: 14px;
                cursor: pointer;
                outline: none;
            }

            .hr-attendance-dashboard .table-section {
                background-color: var(--bg-surface);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--border-color);
                overflow-x: auto;
                margin-bottom: 32px;
            }

            .hr-attendance-dashboard table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }

            .hr-attendance-dashboard th, .hr-attendance-dashboard td {
                padding: 16px 24px;
            }

            .hr-attendance-dashboard th {
                background-color: var(--bg-main);
                color: var(--text-muted);
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                border-bottom: 1px solid var(--border-color);
            }

            .hr-attendance-dashboard td {
                border-bottom: 1px solid var(--border-color);
                font-size: 14px;
            }

            .hr-attendance-dashboard tbody tr:hover {
                background-color: var(--bg-main);
            }

            .hr-attendance-dashboard .progress-container {
                width: 100%;
                background-color: var(--border-color);
                border-radius: 4px;
                height: 8px;
                overflow: hidden;
                margin-top: 4px;
            }

            .hr-attendance-dashboard .progress-bar {
                height: 100%;
                border-radius: 4px;
                width: 0%;
                transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .hr-attendance-dashboard .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                display: inline-block;
                position: relative;
                cursor: default;
            }

            .hr-attendance-dashboard .status-badge:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 120%;
                left: 50%;
                transform: translateX(-50%);
                background: #1F2937;
                color: #fff;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                z-index: 20;
            }

            .hr-attendance-dashboard .logic-card {
                background-color: var(--bg-surface);
                border-radius: var(--radius-lg);
                padding: 24px;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--border-color);
                max-width: 600px;
            }
        </style>

        <div class="hr-attendance-dashboard">
            <!-- Summary Cards -->
            <section class="summary-cards">
                <div class="data-card card-blue">
                    <div class="card-icon"><i class="ph-fill ph-calendar-blank"></i></div>
                    <div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Working Days</div>
                        <div style="font-size: 24px; font-weight: 700;">20</div>
                    </div>
                </div>
                <div class="data-card card-green">
                    <div class="card-icon"><i class="ph-fill ph-user-check"></i></div>
                    <div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Present Today</div>
                        <div id="count-present" style="font-size: 24px; font-weight: 700;">0</div>
                    </div>
                </div>
                <div class="data-card card-red">
                    <div class="card-icon"><i class="ph-fill ph-user-minus"></i></div>
                    <div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Absent Today</div>
                        <div id="count-absent" style="font-size: 24px; font-weight: 700;">0</div>
                    </div>
                </div>
                <div class="data-card card-orange">
                    <div class="card-icon"><i class="ph-fill ph-clock-user"></i></div>
                    <div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">On Leave</div>
                        <div id="count-leave" style="font-size: 24px; font-weight: 700;">0</div>
                    </div>
                </div>
                <div class="data-card card-purple">
                    <div class="card-icon"><i class="ph-fill ph-chart-line-up"></i></div>
                    <div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Avg Attendance</div>
                        <div style="font-size: 24px; font-weight: 700;">91%</div>
                    </div>
                </div>
            </section>

            <!-- Filters Section -->
            <section class="filters-section">
                <div class="search-bar">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="hrSearchInput" placeholder="Search by name or ID...">
                </div>
                <div class="filter-dropdowns">
                    <select id="hrDeptFilter">
                        <option value="all">All Departments</option>
                        <option value="engineering">Engineering</option>
                        <option value="marketing">Marketing</option>
                        <option value="design">Design</option>
                        <option value="hr">HR</option>
                    </select>
                    <select id="hrStatusFilter">
                        <option value="all">All Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">On Leave</option>
                    </select>
                    <input type="date" id="hrDatePicker" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </section>

            <!-- Attendance Table -->
            <section class="table-section">
                <table id="hrAttendanceTable">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Check-in Time</th>
                            <th>Work Hours</th>
                            <th>Work Progress</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="hrTableBody">
                    </tbody>
                </table>
            </section>

            <!-- Footer Logic Section -->
            <section style="display: flex; justify-content: flex-start;">
                <div class="logic-card">
                    <h3 style="margin-top:0; display:flex; align-items:center; gap:8px;">
                        <i class="ph-fill ph-calculator" style="color:var(--hr-primary);"></i> Attendance Calculation Method
                    </h3>
                    <div style="background-color: var(--bg-main); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-weight: 600; margin-bottom: 16px;">
                        Progress % = (Total Hours Spent / Estimated Hours) * 100
                    </div>
                    <ul style="list-style:none; padding:0; margin:0;">
                        <li style="margin-bottom: 8px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph-fill ph-check-circle" style="color:var(--hr-success);"></i> <strong>Marked Present</strong> → if progress ≥ 50%
                        </li>
                        <li style="font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph-fill ph-warning-circle" style="color:var(--hr-warning);"></i> <strong>Escalated</strong> → if progress &lt; 50%
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    `;

    // JavaScript Logic
    const tableBody = document.getElementById('hrTableBody');
    const searchInput = document.getElementById('hrSearchInput');
    const deptFilter = document.getElementById('hrDeptFilter');
    const statusFilter = document.getElementById('hrStatusFilter');

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">No results found</td></tr>';
            return;
        }

        data.forEach(emp => {
            const rawProgress = (emp.hours / emp.estHours) * 100;
            const progress = Math.min(Math.round(rawProgress), 100);
            
            let barColor = 'var(--hr-danger)';
            if (progress >= 70) barColor = 'var(--hr-success)';
            else if (progress >= 50) barColor = '#EAB308'; // Yellow

            let badgeConfig = { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--hr-success)', border: 'rgba(34, 197, 94, 0.2)', text: 'Checked in normally' };
            switch(emp.status) {
                case 'late': badgeConfig = { bg: 'rgba(249, 115, 22, 0.1)', color: 'var(--hr-warning)', border: 'rgba(249, 115, 22, 0.2)', text: 'Arrived after threshold' }; break;
                case 'absent': badgeConfig = { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--hr-danger)', border: 'rgba(239, 68, 68, 0.2)', text: 'No check-in recorded' }; break;
                case 'leave': badgeConfig = { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--hr-info)', border: 'rgba(59, 130, 246, 0.2)', text: 'Approved leave' }; break;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="#" style="color:var(--hr-primary); font-weight:600; text-decoration:none;">${emp.id}</a></td>
                <td style="font-weight:500;">${emp.name}</td>
                <td style="text-transform: capitalize;">${emp.dept}</td>
                <td>${emp.checkIn}</td>
                <td>${emp.hours}h / ${emp.estHours}h</td>
                <td>
                    <div style="font-size:12px; color:var(--text-muted); font-weight:500;">${progress}%</div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: 0%; background-color: ${barColor};" data-target="${progress}%"></div>
                    </div>
                </td>
                <td>
                    <span class="status-badge" style="background:${badgeConfig.bg}; color:${badgeConfig.color}; border:1px solid ${badgeConfig.border};" data-tooltip="${badgeConfig.text}">
                        ${emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                    </span>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        setTimeout(() => {
            const bars = container.querySelectorAll('.progress-bar');
            bars.forEach(bar => {
                bar.style.width = bar.getAttribute('data-target');
            });
        }, 50);
    }

    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const dept = deptFilter.value;
        const status = statusFilter.value;

        const filtered = employees.filter(emp => {
            const mSearch = emp.name.toLowerCase().includes(term) || emp.id.toLowerCase().includes(term);
            const mDept = dept === 'all' || emp.dept === dept;
            const mStatus = status === 'all' || emp.status === status;
            return mSearch && mDept && mStatus;
        });

        renderTable(filtered);
        updateStats(filtered);
    }

    function updateStats(data) {
        let pres = 0, abs = 0, lev = 0;
        data.forEach(e => {
            if(e.status === 'present' || e.status === 'late') pres++;
            if(e.status === 'absent') abs++;
            if(e.status === 'leave') lev++;
        });

        document.getElementById('count-present').innerText = pres;
        document.getElementById('count-absent').innerText = abs;
        document.getElementById('count-leave').innerText = lev;
    }

    searchInput.addEventListener('input', applyFilters);
    deptFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    renderTable(employees);
    updateStats(employees);
}

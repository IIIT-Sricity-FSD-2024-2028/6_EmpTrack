// /js/views/hr/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderHRDashboard(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Dashboard</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
        </div>
    `;

    // Dummy JSON Data
    const data = {
        summary: {
            employees: { count: 156, trend: '+12' },
            projects: { count: 24, trend: '+3' },
            present: { count: 142, perc: '91%' },
            leaves: { count: 8, trend: '-2' }
        },
        departments: [
            { name: 'Engineering', present: 42, absent: 3, total: 45 },
            { name: 'Design', present: 17, absent: 1, total: 18 },
            { name: 'Marketing', present: 20, absent: 2, total: 22 },
            { name: 'Sales', present: 32, absent: 3, total: 35 },
            { name: 'Operations', present: 25, absent: 3, total: 28 },
            { name: 'HR', present: 6, absent: 2, total: 8 }
        ],
        recentEmployees: [
            { id: 1, name: 'Alice Cooper', role: 'Frontend Dev', dept: 'Engineering', joined: '10 Oct, 2023', status: 'Active' },
            { id: 2, name: 'Bob Wilson', role: 'UI/UX Designer', dept: 'Design', joined: '12 Oct, 2023', status: 'Active' },
            { id: 3, name: 'Carol Smith', role: 'SEO Specialist', dept: 'Marketing', joined: '15 Oct, 2023', status: 'Active' }
        ],
        pendingLeaves: [
            { id: 101, name: 'John Doe', type: 'Sick Leave', range: '20 Oct - 22 Oct', duration: '3 days' },
            { id: 102, name: 'Jane Smith', type: 'Casual Leave', range: '24 Oct - 25 Oct', duration: '2 days' },
            { id: 103, name: 'Mike Johnson', type: 'Paid Leave', range: '01 Nov - 05 Nov', duration: '5 days' }
        ]
    };

    container.innerHTML = `
        <style>
            .hr-dashboard-root {
                --hr-primary: #7C3AED;
                --hr-success: #22C55E;
                --hr-danger: #EF4444;
                --hr-warning: #F97316;
                --hr-info: #3B82F6;
                --hr-bg-main: var(--bg-surface);
                --hr-border: var(--border-color);
                --hr-text: var(--text-main);
                font-family: 'Inter', sans-serif;
                animation: hrFadeIn 0.4s ease-out forwards;
            }

            @keyframes hrFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .hr-dashboard-root .card {
                background: var(--hr-bg-main);
                border-radius: 12px;
                border: 1px solid var(--hr-border);
                box-shadow: var(--shadow-sm);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                overflow: hidden;
            }

            .hr-dashboard-root .card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-md);
            }

            /* Summary Row */
            .hr-dashboard-root .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
                margin-bottom: 24px;
            }

            .hr-dashboard-root .summary-card {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .hr-dashboard-root .sc-header { display: flex; justify-content: space-between; align-items: center; }
            .hr-dashboard-root .sc-icon { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; }
            .hr-dashboard-root .sc-trend { font-size:12px; font-weight:600; padding:4px 8px; border-radius:12px; }
            
            .hr-dashboard-root .sc-value { font-size:28px; font-weight:700; color:var(--text-main); line-height:1; }
            .hr-dashboard-root .sc-label { font-size:13px; color:var(--text-muted); font-weight:500; }

            /* Grid Layout */
            .hr-dashboard-root .main-grid {
                display: grid;
                grid-template-columns: 1.5fr 1fr;
                gap: 24px;
                margin-bottom: 24px;
            }

            @media (max-width: 900px) {
                .hr-dashboard-root .main-grid { grid-template-columns: 1fr; }
            }

            /* Dept Attendance */
            .hr-dashboard-root .dept-list { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
            .hr-dashboard-root .dept-item { display: flex; flex-direction: column; gap: 8px; }
            .hr-dashboard-root .dept-header { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; color:var(--text-main); }
            
            .hr-dashboard-root .dept-stats { display: flex; gap: 8px; font-weight:600; }
            .hr-dashboard-root .dept-stat-box { display: flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 8px; font-size: 13px; min-width: 60px; }
            .hr-dashboard-root .dept-stat-box.green { background: rgba(34, 197, 94, 0.15); color: var(--hr-success); }
            .hr-dashboard-root .dept-stat-box.red { background: rgba(239, 68, 68, 0.15); color: var(--hr-danger); }

            .hr-dashboard-root .progress-track { height: 6px; background: var(--hr-border); border-radius: 4px; overflow: hidden; }
            .hr-dashboard-root .progress-fill { height: 100%; background: var(--hr-success); border-radius: 4px; width: 0%; transition: width 1s ease-out; }

            /* Lists */
            .hr-dashboard-root .list-wrapper { padding: 0 20px 20px 20px; display:flex; flex-direction:column; gap:0; }
            .hr-dashboard-root .list-item { 
                padding: 16px 0; 
                border-bottom: 1px solid var(--hr-border); 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
            }
            .hr-dashboard-root .list-item:last-child { border-bottom: none; padding-bottom: 0; }
            
            .hr-dashboard-root .li-left { display: flex; align-items: center; gap: 12px; }
            .hr-dashboard-root .li-avatar { width:40px; height:40px; border-radius:50%; background:var(--primary-light); color:var(--hr-primary); display:flex; align-items:center; justify-content:center; font-weight:600; }
            .hr-dashboard-root .li-details { display:flex; flex-direction:column; gap:4px; }
            .hr-dashboard-root .li-name { font-weight:600; font-size:14px; color:var(--text-main); }
            .hr-dashboard-root .li-sub { font-size:12px; color:var(--text-muted); }

            .hr-dashboard-root .badge { padding: 4px 8px; font-size:11px; font-weight:600; border-radius:12px; }
            .hr-dashboard-root .badge.green { background: rgba(34,197,94,0.1); color: var(--hr-success); }
            .hr-dashboard-root .badge.blue { background: rgba(59,130,246,0.1); color: var(--hr-info); }

            .hr-dashboard-root .action-btns { display: flex; gap: 8px; }
            .hr-dashboard-root .btn-text { padding: 6px 14px; border-radius: 6px; display:flex; align-items:center; gap:6px; font-size: 12px; font-weight: 600; cursor:pointer; border:none; transition:0.2s; color:white; }
            .hr-dashboard-root .btn-approve { background: var(--hr-success); }
            .hr-dashboard-root .btn-reject { background: var(--hr-danger); }
            .hr-dashboard-root .btn-text:hover { opacity: 0.8; transform:translateY(-1px); }

            /* Bottom Actions */
            .hr-dashboard-root .actions-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
            }
            .hr-dashboard-root .action-card {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                cursor: pointer;
                text-decoration: none;
                color: var(--text-main);
            }
            .hr-dashboard-root .ac-icon {
                width: 48px; height: 48px; border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size:24px; color:white;
            }

            @media (max-width: 600px) {
                .hr-dashboard-root .actions-grid { grid-template-columns: 1fr; }
            }

            /* Tooltips */
            .hr-tooltip {
                position: relative;
            }
            .hr-tooltip::after {
                content: attr(data-tip);
                position: absolute;
                bottom: 120%;
                left: 50%;
                transform: translateX(-50%);
                background: #1F2937;
                color: white;
                padding: 4px 8px;
                font-size: 11px;
                border-radius: 4px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: 0.2s;
            }
            .hr-tooltip:hover::after { opacity: 1; }
            
        </style>

        <div class="hr-dashboard-root">
            
            <!-- Summary Row -->
            <div class="summary-grid">
                <div class="card summary-card">
                    <div class="sc-header">
                        <div class="sc-icon" style="background:rgba(59,130,246,0.1); color:var(--hr-info);"><i class="ph-fill ph-users"></i></div>
                        <div class="sc-trend" style="background:rgba(34,197,94,0.1); color:var(--hr-success);">${data.summary.employees.trend}</div>
                    </div>
                    <div>
                        <div class="sc-value count-anim" data-val="${data.summary.employees.count}">0</div>
                        <div class="sc-label">Total Employees</div>
                    </div>
                </div>

                <div class="card summary-card">
                    <div class="sc-header">
                        <div class="sc-icon" style="background:rgba(124,58,237,0.1); color:var(--hr-primary);"><i class="ph-fill ph-rocket"></i></div>
                        <div class="sc-trend" style="background:rgba(34,197,94,0.1); color:var(--hr-success);">${data.summary.projects.trend}</div>
                    </div>
                    <div>
                        <div class="sc-value count-anim" data-val="${data.summary.projects.count}">0</div>
                        <div class="sc-label">Active Projects</div>
                    </div>
                </div>

                <div class="card summary-card">
                    <div class="sc-header">
                        <div class="sc-icon" style="background:rgba(34,197,94,0.1); color:var(--hr-success);"><i class="ph-fill ph-check-circle"></i></div>
                        <div class="sc-trend" style="background:rgba(34,197,94,0.1); color:var(--hr-success);">${data.summary.present.perc}</div>
                    </div>
                    <div>
                        <div class="sc-value count-anim" data-val="${data.summary.present.count}">0</div>
                        <div class="sc-label">Present Today</div>
                    </div>
                </div>

                <div class="card summary-card">
                    <div class="sc-header">
                        <div class="sc-icon" style="background:rgba(249,115,22,0.1); color:var(--hr-warning);"><i class="ph-fill ph-calendar-x"></i></div>
                        <div class="sc-trend" style="background:rgba(239,68,68,0.1); color:var(--hr-danger);">${data.summary.leaves.trend}</div>
                    </div>
                    <div>
                        <div class="sc-value count-anim" data-val="${data.summary.leaves.count}">0</div>
                        <div class="sc-label">Pending Leaves</div>
                    </div>
                </div>
            </div>

            <!-- Main Grid -->
            <div class="main-grid">
                
                <!-- Left: Attendance Dept Overview -->
                <div class="card" style="display:flex; flex-direction:column;">
                    <div style="padding:20px 20px 0 20px; font-weight:600; font-size:16px;">Attendance Overview by Department</div>
                    <div class="dept-list">
                        ${data.departments.map(d => {
                            const perc = (d.present / d.total) * 100;
                            return `
                                <div class="dept-item">
                                    <div class="dept-header">
                                        <span>${d.name} (${d.total})</span>
                                        <div class="dept-stats">
                                            <div class="dept-stat-box green">${d.present} Present</div>
                                            <div class="dept-stat-box red">${d.absent} Absent</div>
                                        </div>
                                    </div>
                                    <div class="progress-track">
                                        <div class="progress-fill" data-width="${perc}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Right: Two lists stacked -->
                <div style="display:flex; flex-direction:column; gap:24px;">
                    
                    <!-- Recent Employees -->
                    <div class="card">
                        <div style="padding:20px; font-weight:600; font-size:16px; display:flex; justify-content:space-between;">
                            <span>Recently Added</span>
                            <span style="font-size:12px; color:var(--hr-primary); cursor:pointer;">View All</span>
                        </div>
                        <div class="list-wrapper">
                            ${data.recentEmployees.map(e => `
                                <div class="list-item">
                                    <div class="li-left">
                                        <div class="li-avatar">${e.name.charAt(0)}</div>
                                        <div class="li-details">
                                            <div class="li-name">${e.name}</div>
                                            <div class="li-sub">${e.role} • ${e.dept}</div>
                                            <div class="li-sub" style="font-size:10px;">Joined ${e.joined}</div>
                                        </div>
                                    </div>
                                    <div class="badge green">${e.status}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Pending Leaves -->
                    <div class="card">
                        <div style="padding:20px; font-weight:600; font-size:16px; display:flex; justify-content:space-between;">
                            <span>Leave Approvals</span>
                            <span class="badge blue">${data.pendingLeaves.length} Pending</span>
                        </div>
                        <div class="list-wrapper" id="leavesContainer">
                            ${data.pendingLeaves.map(l => `
                                <div class="list-item" id="leave-row-${l.id}">
                                    <div class="li-left">
                                        <div class="li-details">
                                            <div class="li-name">${l.name} <span class="badge blue" style="font-size:9px; margin-left:4px;">${l.duration}</span></div>
                                            <div class="li-sub"><i class="ph ph-calendar"></i> ${l.range}</div>
                                            <div class="li-sub" style="font-weight:500; color:var(--hr-warning);">${l.type}</div>
                                        </div>
                                    </div>
                                    <div class="action-btns">
                                        <button class="btn-text btn-approve" onclick="window.handleHRLeaveAction(${l.id}, 'approve')">
                                            <i class="ph ph-check"></i> Approve
                                        </button>
                                        <button class="btn-text btn-reject" onclick="window.handleHRLeaveAction(${l.id}, 'reject')">
                                            <i class="ph ph-x"></i> Reject
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                </div>
            </div>

            <!-- Bottom Actions -->
            <div class="actions-grid">
                <a href="#hr-attendance" class="card action-card">
                    <div class="ac-icon" style="background: var(--hr-success);"><i class="ph ph-calendar-check"></i></div>
                    <div>
                        <div style="font-weight:600; font-size:16px;">View Attendance</div>
                        <div style="font-size:12px; color:var(--text-muted);">Manage daily records</div>
                    </div>
                </a>
                <a href="#escalations" class="card action-card">
                    <div class="ac-icon" style="background: var(--hr-warning);"><i class="ph ph-envelope-open"></i></div>
                    <div>
                        <div style="font-weight:600; font-size:16px;">Manage Leaves</div>
                        <div style="font-size:12px; color:var(--text-muted);">Review pending requests</div>
                    </div>
                </a>
                <a href="#org-reports" class="card action-card">
                    <div class="ac-icon" style="background: var(--hr-primary);"><i class="ph ph-chart-bar"></i></div>
                    <div>
                        <div style="font-weight:600; font-size:16px;">View Reports</div>
                        <div style="font-size:12px; color:var(--text-muted);">Org analytics & stats</div>
                    </div>
                </a>
            </div>

        </div>
    `;

    // JavaScript Intializations after rendering

    // 1. Progress Bar Animation
    setTimeout(() => {
        const bars = container.querySelectorAll('.progress-fill');
        bars.forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);

    // 2. Count Animation
    const counters = container.querySelectorAll('.count-anim');
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

}

// Global action handler for leaves component
window.handleHRLeaveAction = function(id, action) {
    const row = document.getElementById(`leave-row-${id}`);
    if(!row) return;

    if (action === 'approve') {
        const btns = row.querySelector('.action-btns');
        btns.innerHTML = `<span class="badge green">Approved ✅</span>`;
    } else {
        row.style.opacity = '0.5';
        setTimeout(() => row.remove(), 300);
    }
};

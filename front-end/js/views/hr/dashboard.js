// /js/views/hr/dashboard.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guard logic

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

    // Populate Summary
    document.getElementById('emp-trend').textContent = data.summary.employees.trend;
    document.getElementById('emp-count').setAttribute('data-val', data.summary.employees.count);

    document.getElementById('proj-trend').textContent = data.summary.projects.trend;
    document.getElementById('proj-count').setAttribute('data-val', data.summary.projects.count);

    document.getElementById('present-perc').textContent = data.summary.present.perc;
    document.getElementById('present-count').setAttribute('data-val', data.summary.present.count);

    document.getElementById('leave-trend').textContent = data.summary.leaves.trend;
    document.getElementById('leave-count').setAttribute('data-val', data.summary.leaves.count);

    // Populate Departments
    const deptListContainer = document.getElementById('dept-list-container');
    if (deptListContainer) {
        deptListContainer.innerHTML = data.departments.map(d => {
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
        }).join('');
    }

    // Populate Recent Employees
    const recentEmpContainer = document.getElementById('recent-emp-container');
    if (recentEmpContainer) {
        recentEmpContainer.innerHTML = data.recentEmployees.map(e => `
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
        `).join('');
    }

    // Populate Pending Leaves
    const pendingLeavesBadge = document.getElementById('pending-leaves-badge');
    if (pendingLeavesBadge) {
        pendingLeavesBadge.textContent = `${data.pendingLeaves.length} Pending`;
    }

    const leavesContainer = document.getElementById('leavesContainer');
    if (leavesContainer) {
        leavesContainer.innerHTML = data.pendingLeaves.map(l => `
            <div class="list-item" id="leave-row-${l.id}">
                <div class="li-left">
                    <div class="li-details">
                        <div class="li-name">${l.name} <span class="badge blue" style="font-size:9px; margin-left:4px;">${l.duration}</span></div>
                        <div class="li-sub"><i class="ph ph-calendar"></i> ${l.range}</div>
                        <div class="li-sub" style="font-weight:500; color:var(--hr-warning);">${l.type}</div>
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn-text btn-approve" data-id="${l.id}" data-action="approve">
                        <i class="ph ph-check"></i> Approve
                    </button>
                    <button class="btn-text btn-reject" data-id="${l.id}" data-action="reject">
                        <i class="ph ph-x"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for leave actions
        leavesContainer.querySelectorAll('.action-btns button').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget;
                const id = target.getAttribute('data-id');
                const action = target.getAttribute('data-action');
                handleHRLeaveAction(id, action);
            });
        });
    }

    // JavaScript Intializations after rendering

    // 1. Progress Bar Animation
    setTimeout(() => {
        const bars = document.querySelectorAll('.progress-fill');
        bars.forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);

    // 2. Count Animation
    const counters = document.querySelectorAll('.count-anim');
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

    // Local handler
    async function handleHRLeaveAction(id, action) {
        const row = document.getElementById(`leave-row-${id}`);
        if(!row) return;

        if (action === 'approve') {
            const btns = row.querySelector('.action-btns');
            btns.innerHTML = `<span class="badge green">Approved ✅</span>`;
        } else {
            row.style.opacity = '0.5';
            setTimeout(() => row.remove(), 300);
        }
    }
});


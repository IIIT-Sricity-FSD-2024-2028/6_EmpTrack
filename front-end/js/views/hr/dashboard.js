// /js/views/hr/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guard logic

    const compileDashboardData = () => {
        const allEmps = db.data.employee;
        const allLeaves = db.data.leave_details;
        const allAttendance = db.data.attendance;
        const today = new Date().toISOString().split('T')[0];

        // Summaries
        const eCount = allEmps.length;
        
        let presentCount = 0;
        let onLeaveCount = 0;
        
        allEmps.forEach(emp => {
            const att = allAttendance.find(a => a.emp_id === emp.emp_id && a.attendance_date === today);
            if(att && att.status === 'PRESENT') {
                presentCount++;
            } else {
                const onLeave = allLeaves.some(l => l.emp_id === emp.emp_id && l.status === 'APPROVED' && today >= l.start_date && today <= l.end_date);
                if(onLeave) onLeaveCount++;
            }
        });

        // Departments mapping
        const depts = {
            'D01': { name: 'HR', present: 0, absent: 0, total: 0 },
            'D02': { name: 'Engineering', present: 0, absent: 0, total: 0 },
            'D03': { name: 'Sales', present: 0, absent: 0, total: 0 },
            'D04': { name: 'Design', present: 0, absent: 0, total: 0 },
            'D05': { name: 'Marketing', present: 0, absent: 0, total: 0 }
        };
        allEmps.forEach(emp => {
            const d = depts[emp.department_id] || depts['D02']; // fallback
            d.total++;
            const att = allAttendance.find(a => a.emp_id === emp.emp_id && a.attendance_date === today);
            if(att && att.status === 'PRESENT') d.present++;
            else d.absent++;
        });

        const deptArray = Object.values(depts).filter(d => d.total > 0);

        // Recent Employees (sort by join date)
        const recent = [...allEmps].sort((a,b) => new Date(b.date_of_joining) - new Date(a.date_of_joining)).slice(0, 5).map(e => ({
            id: e.emp_id,
            name: e.emp_name.split(' (')[0],
            role: e.role,
            dept: depts[e.department_id] ? depts[e.department_id].name : 'Other',
            joined: e.date_of_joining,
            status: e.status === 'ACTIVE' ? 'Active' : 'Inactive'
        }));

        // Pending Leaves
        const pending = allLeaves.filter(l => l.status === 'PENDING').map(l => {
            const emp = db.getUserById(l.emp_id);
            return {
                id: l.leave_id,
                name: emp ? emp.emp_name.split(' (')[0] : 'Unknown',
                type: l.leave_type + ' Leave',
                range: `${l.start_date} - ${l.end_date}`,
                duration: `${l.days} days`
            };
        });

        return {
            summary: {
                employees: { count: eCount, trend: '+1' },
                projects: { count: db.data.task ? db.data.task.length : 0, trend: '-' },
                present: { count: presentCount, perc: eCount > 0 ? Math.round((presentCount/eCount)*100)+'%' : '0%' },
                leaves: { count: onLeaveCount, trend: '-' }
            },
            departments: deptArray,
            recentEmployees: recent,
            pendingLeaves: pending
        };
    };

    let data = compileDashboardData();

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
            btn.addEventListener('click', (e) => {
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
    function handleHRLeaveAction(id, action) {
        const row = document.getElementById(`leave-row-${id}`);
        if(!row) return;

        if (action === 'approve') {
            db.updateLeaveStatus(id, 'APPROVED', user.emp_id);
            const btns = row.querySelector('.action-btns');
            btns.innerHTML = `<span class="badge green">Approved ✅</span>`;
        } else {
            db.updateLeaveStatus(id, 'REJECTED', user.emp_id);
            row.style.opacity = '0.5';
            setTimeout(() => row.remove(), 300);
        }
    }
});

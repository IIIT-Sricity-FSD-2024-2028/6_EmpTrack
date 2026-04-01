// /js/views/hr/attendance.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getAttendanceData = () => {
        const today = new Date().toISOString().split('T')[0];
        
        return db.data.employee.map(emp => {
            const att = db.data.attendance.find(a => a.emp_id === emp.emp_id && a.attendance_date === today);
            const deptName = emp.department_id === 'D01' ? 'HR' : emp.department_id === 'D02' ? 'Engineering' : 'Other';
            
            let status = 'absent';
            let checkIn = '-';
            let hours = 0;
            
            if (att) {
                checkIn = att.check_in_time || '-';
                hours = parseFloat(att.hours_spent || 0);
                if (att.status === 'PRESENT') {
                    // Decide if late based on time, mock logic: > 09:10 is late
                    if (checkIn > '09:10') status = 'late';
                    else status = 'present';
                } else if (att.status === 'WEEKEND' || att.status === 'LEAVE' || att.status === 'ESCALATED') {
                    status = 'leave';
                }
            } else {
                // If they are on approved leave today
                const leaves = db.data.leave_details.filter(l => l.emp_id === emp.emp_id && l.status === 'APPROVED');
                const onLeave = leaves.some(l => today >= l.start_date && today <= l.end_date);
                if(onLeave) status = 'leave';
            }
            
            return {
                id: emp.emp_id,
                name: emp.emp_name.split(' (')[0],
                dept: deptName.toLowerCase(),
                checkIn: checkIn,
                hours: hours,
                estHours: 8,
                status: status
            };
        });
    };

    let employees = getAttendanceData();

    const tableBody = document.getElementById('hrTableBody');
    const searchInput = document.getElementById('hrSearchInput');
    const deptFilter = document.getElementById('hrDeptFilter');
    const statusFilter = document.getElementById('hrStatusFilter');

    function renderTable(data) {
        if (!tableBody) return;
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

        // Trigger animations
        setTimeout(() => {
            const bars = document.querySelectorAll('.progress-bar');
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
            const mDept = dept === 'all' || emp.dept.toLowerCase() === dept.toLowerCase();
            const mStatus = status === 'all' || emp.status.toLowerCase() === status.toLowerCase();
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

        const cPresent = document.getElementById('count-present');
        const cAbsent = document.getElementById('count-absent');
        const cLeave = document.getElementById('count-leave');

        if (cPresent) cPresent.innerText = pres;
        if (cAbsent) cAbsent.innerText = abs;
        if (cLeave) cLeave.innerText = lev;
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (deptFilter) deptFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    renderTable(employees);
    updateStats(employees);
});

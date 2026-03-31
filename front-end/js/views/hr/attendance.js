// /js/views/hr/attendance.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

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

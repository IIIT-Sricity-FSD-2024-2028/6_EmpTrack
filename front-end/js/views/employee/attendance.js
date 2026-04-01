// /js/views/employee/attendance.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js

    // Helper re-rendering function
    function render() {
        // Fetch dependencies + Data
        const attendanceRecords = db.getAttendanceForUser(user.emp_id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecord = attendanceRecords.find(a => a.attendance_date === todayStr);

        let isCheckedIn = !!(todaysRecord && todaysRecord.check_in_time && !todaysRecord.check_out_time);
        let isCheckedOut = !!(todaysRecord && todaysRecord.check_out_time);

        // Default modes
        let activeLocation = todaysRecord?.attendance_mode === "REMOTE" ? "Home" : "Office";

        // Summary Metrics
        let todayStatusText = todaysRecord ? "Present" : "Absent";
        if (!todaysRecord) todayStatusText = "Pending";
        let statusColor = todaysRecord ? "var(--secondary-color)" : "var(--text-muted)";
        let hoursToday = todaysRecord?.hours_spent || 0;
        let progressPerc = isCheckedIn ? 40 : (isCheckedOut ? 100 : 0);

        let presentDays = attendanceRecords.filter(a => a.status === 'PRESENT' && a.attendance_date.startsWith(todayStr.slice(0, 7))).length;
        let monthString = `${presentDays}/22`; // Assuming 22 work days mapped "this month"

        // Update Summary Cards
        const statusEl = document.getElementById('summary-status');
        if (statusEl) {
            statusEl.textContent = todayStatusText;
            statusEl.style.color = statusColor;
        }
        document.getElementById('summary-hours').textContent = hoursToday;
        document.getElementById('summary-progress').textContent = `${progressPerc}%`;
        document.getElementById('summary-month').textContent = monthString;

        // Interactive Check-in State
        const locOffice = document.getElementById('loc-office');
        const locHome = document.getElementById('loc-home');
        const btnCheckin = document.getElementById('btn-checkin');
        const btnCheckout = document.getElementById('btn-checkout');

        if (locOffice && locHome && btnCheckin && btnCheckout) {
            // Reset state
            locOffice.className = 'location-toggle';
            locHome.className = 'location-toggle';
            locOffice.disabled = false;
            locHome.disabled = false;
            btnCheckin.className = 'btn btn-purple';
            btnCheckout.className = 'btn btn-outline';

            if (activeLocation === 'Office') locOffice.classList.add('active');
            else locHome.classList.add('active');

            if (isCheckedIn || isCheckedOut) {
                locOffice.disabled = true;
                locHome.disabled = true;
                btnCheckin.classList.add('action-btn-disabled');
            }
            if (!isCheckedIn || isCheckedOut) {
                btnCheckout.classList.add('action-btn-disabled');
            }
        }

        // Section 3 Analytics Update
        let attendanceRate = Math.round((presentDays / 22) * 100) || 0;
        let avgProgress = 72;
        let escalationCount = attendanceRecords.filter(a => a.status === 'ESCALATED').length;

        document.getElementById('rate-circle').setAttribute('stroke-dasharray', `${attendanceRate}, 100`);
        document.getElementById('rate-text').textContent = `${attendanceRate}%`;
        document.getElementById('metric-avg').textContent = `${avgProgress}%`;
        document.getElementById('metric-escalations').textContent = escalationCount;

        // Render Table
        const tbody = document.getElementById('attendance-table-body');
        if (tbody) {
            tbody.innerHTML = attendanceRecords.reverse().map(a => {
                let badge = 'badge-not-started';
                if (parseInt(a.hours_spent) < 4.0) {
                    a.status = 'ESCALATED'
                }
                if (a.status === 'PRESENT') badge = 'badge-present';
                if (a.status === 'ABSENT') badge = 'badge-absent';
                if (a.status === 'WEEKEND') badge = 'badge-weekend';
                if (a.status === 'ESCALATED') badge = 'badge-escalated';

                let highlightRow = a.attendance_date === todayStr ? 'background-color:#F5F3FF;' : '';

                return `
                <tr style="transition: background-color 0.2s; ${highlightRow}" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor='${highlightRow ? '#F5F3FF' : ''}'">
                    <td style="padding: 16px; font-weight:var(--font-medium);">${a.attendance_date}</td>
                    <td style="padding: 16px;">
                        <span class="badge ${badge}" style="padding: 4px 12px; text-transform:capitalize;">${a.status.toLowerCase()}</span>
                    </td>
                    <td style="padding: 16px;">${a.hours_spent || '-'}</td>
                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${a.remarks || '-'}</td>
                </tr>
                `;
            }).join('');
        }
    }

    // Initial render
    render();

    // Event Listeners (Attach ONCE)
    let activeLocation = 'Office'; // local mutable state for button clicks before DB commit

    document.getElementById('loc-office')?.addEventListener('click', () => {
        const attendanceRecords = db.getAttendanceForUser(user.emp_id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecord = attendanceRecords.find(a => a.attendance_date === todayStr);
        if (todaysRecord && (todaysRecord.check_in_time || todaysRecord.check_out_time)) return;

        activeLocation = "Office";
        document.getElementById('loc-office').classList.add('active');
        document.getElementById('loc-home').classList.remove('active');
    });

    document.getElementById('loc-home')?.addEventListener('click', () => {
        const attendanceRecords = db.getAttendanceForUser(user.emp_id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecord = attendanceRecords.find(a => a.attendance_date === todayStr);
        if (todaysRecord && (todaysRecord.check_in_time || todaysRecord.check_out_time)) return;

        activeLocation = "Home";
        document.getElementById('loc-home').classList.add('active');
        document.getElementById('loc-office').classList.remove('active');
    });

    document.getElementById('btn-checkin')?.addEventListener('click', () => {
        const attendanceRecords = db.getAttendanceForUser(user.emp_id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecord = attendanceRecords.find(a => a.attendance_date === todayStr);
        if (todaysRecord && todaysRecord.check_in_time) return;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const overrideLocElement = document.getElementById('loc-home');
        if (overrideLocElement && overrideLocElement.classList.contains('active')) activeLocation = 'Home';

        const res = db.markAttendance(user.emp_id, timeStr, activeLocation === "Home" ? "REMOTE" : "OFFICE");
        if (res && !res.error) {
            res.remarks = "Checked In";
            db.saveData();
            render();
        }
    });

    document.getElementById('btn-checkout')?.addEventListener('click', () => {
        const res = db.markCheckOut(user.emp_id);
        if (res && !res.error) {
            res.remarks = "Completed";
            db.saveData();
            render();
        }
    });
});

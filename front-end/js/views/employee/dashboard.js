// /js/views/employee/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js anyway

    // Set Welcome Msg
    const welcomeEl = document.getElementById('welcome-message');
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.emp_name.split(' ')[0]}!`;
    
    // Data Extraction
    const allTasks = await db.getTasksForUser(user.emp_id);
    const tasks = allTasks.slice(0, 4); 
    
    // Task Stats
    const totalTasks = allTasks.length;
    const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = allTasks.filter(t => t.status === 'NOT_STARTED' || t.status === 'BLOCKED').length;

    document.getElementById('stat-total').textContent = totalTasks;
    document.getElementById('stat-progress').textContent = inProgressTasks;
    document.getElementById('stat-pending').textContent = pendingTasks;
    document.getElementById('stat-completed').textContent = completedTasks;

    // Monthly Attendance calculations
    const allAttendance = await db.getAttendanceForUser(user.emp_id);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const monthRecords = allAttendance.filter(a => a.attendance_date.startsWith(currentMonth));
    const todayRecord = monthRecords.find(a => a.attendance_date === today);
    const presentDays = monthRecords.filter(a => a.status === 'PRESENT').length;
    const totalWorkingDays = 22; 
    const attendancePercentage = Math.round((presentDays / totalWorkingDays) * 100);

    document.getElementById('stat-attendance').textContent = `${attendancePercentage}%`;

    // Tasks Render
    const tasksContainer = document.getElementById('tasks-container');
    if (tasksContainer) {
        tasksContainer.innerHTML = tasks.map(t => `
            <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--spacing-md); background: var(--bg-main);">
                <!-- Top Row: ID and Status -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-bold); letter-spacing: 0.5px;">#${t.task_id}</span>
                    <span class="badge ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'}" style="font-size: 10px;">
                        ${t.status.replace('_', ' ')}
                    </span>
                </div>
                
                <!-- Middle: Task Name -->
                <h4 style="margin: 0 0 16px 0; font-size: var(--text-sm); line-height: 1.4; color: var(--text-main);">${t.task_title}</h4>
                
                <!-- Bottom: Progress Bar -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 10px; color: var(--text-muted);">Progress</span>
                        <span style="font-size: 10px; font-weight: var(--font-bold); color: ${t.progress_percentage === 100 ? 'var(--secondary-color)' : 'var(--text-main)'};">${t.progress_percentage}%</span>
                    </div>
                    <div style="width: 100%; background-color: var(--border-color); border-radius: 4px; overflow: hidden; height: 6px;">
                        <div style="width: ${t.progress_percentage}%; background-color: ${t.progress_percentage === 100 ? 'var(--secondary-color)' : 'var(--primary-color)'}; height: 100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `).join('');
        if (tasks.length === 0) tasksContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center; width:100%; padding: 20px;">No recent tasks.</div>';
    }

    // Attendance Overview Render
    document.getElementById('att-today-badge').textContent = todayRecord ? 'Present' : 'Absent';
    document.getElementById('att-today-badge').className = `badge ${todayRecord ? 'badge-success' : 'badge-danger'}`;
    document.getElementById('att-checkin').textContent = todayRecord?.check_in_time || '--:--';
    document.getElementById('att-hours').textContent = todayRecord ? (todayRecord.hours_spent || Math.round((todayRecord.screen_time||0) / 60) + ' hrs') : '0 hrs';
    document.getElementById('att-month-days').textContent = presentDays;

    // Leave Requests Render
    const recentLeaves = (await db.getLeavesForUser(user.emp_id)).slice(0, 3);
    const leavesList = document.getElementById('leaves-list');
    if (leavesList) {
        leavesList.innerHTML = recentLeaves.map(l => `
            <li style="padding: 12px 0; border-bottom: 1px solid var(--border-light); display:flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin:0; font-size: var(--text-sm);">${l.leave_type} Leave</h4>
                    <p style="margin:2px 0 0 0; font-size: var(--text-xs); color: var(--text-muted);">${l.start_date} to ${l.end_date}</p>
                </div>
                <span class="badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
                    ${l.status}
                </span>
            </li>
        `).join('');
        if (recentLeaves.length === 0) leavesList.innerHTML = '<li style="color:var(--text-muted); text-align:center; padding: 20px;">No leave requests filed.</li>';
    }

});


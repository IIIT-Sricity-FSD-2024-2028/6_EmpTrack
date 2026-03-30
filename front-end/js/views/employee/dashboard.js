// /js/views/employee/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderEmployeeDashboard(container) {
    document.getElementById('page-title').textContent = "Dashboard";
    const user = auth.getCurrentUser();
    
    // Data Extraction
    const allTasks = db.getTasksForUser(user.emp_id);
    const tasks = allTasks.slice(0, 4); // max 4 for summary
    
    // Task Stats
    const totalTasks = allTasks.length;
    const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = allTasks.filter(t => t.status === 'NOT_STARTED' || t.status === 'BLOCKED').length;

    // Monthly Attendance calculations
    const allAttendance = db.getAttendanceForUser(user.emp_id);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const monthRecords = allAttendance.filter(a => a.attendance_date.startsWith(currentMonth));
    const todayRecord = monthRecords.find(a => a.attendance_date === today);
    const presentDays = monthRecords.filter(a => a.status === 'PRESENT').length;
    const totalWorkingDays = 22; // Assumption based on generic month
    const attendancePercentage = Math.round((presentDays / totalWorkingDays) * 100);

    const recentLeaves = db.getLeavesForUser(user.emp_id).slice(0, 3); // Max 3
    
    container.innerHTML = `
        <!-- Welcome Banner -->
        <div class="card" style="margin-bottom: var(--spacing-lg); background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%); color: white; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h2 style="color: white; margin:0 0 5px 0; font-size: var(--text-2xl);">Welcome back, ${user.emp_name.split(' ')[0]}!</h2>
                <p style="color: var(--primary-light); margin:0; font-size: var(--text-sm);">Here is your work summary for today</p>
            </div>
            <!-- Simple Upward Graph Placeholder using native layout + icon -->
            <div style="font-size: 64px; opacity: 0.8; height: 60px; display: flex; align-items: flex-end;">
                <i class="ph ph-trend-up"></i>
            </div>
        </div>

        <!-- 5 Small Components (Total Tasks, In Progress, Pending, Completed, Attendance %) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-xl);">
            
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding: var(--spacing-md);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:var(--text-xl); font-weight:var(--font-bold);">${totalTasks}</span>
                    <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:var(--font-semibold);">Total Tasks</span>
                </div>
                <div style="width:40px; height:40px; border-radius:50%; background-color:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center; font-size:var(--text-lg);">
                    <i class="ph-fill ph-briefcase"></i>
                </div>
            </div>

            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding: var(--spacing-md);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:var(--text-xl); font-weight:var(--font-bold);">${inProgressTasks}</span>
                    <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:var(--font-semibold);">In Progress</span>
                </div>
                <div style="width:40px; height:40px; border-radius:50%; background-color:#EFF6FF; color:#3B82F6; display:flex; align-items:center; justify-content:center; font-size:var(--text-lg);">
                    <i class="ph-fill ph-spinner-gap"></i>
                </div>
            </div>

            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding: var(--spacing-md);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:var(--text-xl); font-weight:var(--font-bold);">${pendingTasks}</span>
                    <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:var(--font-semibold);">Pending</span>
                </div>
                <div style="width:40px; height:40px; border-radius:50%; background-color:#FEF3C7; color:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:var(--text-lg);">
                    <i class="ph-fill ph-clock"></i>
                </div>
            </div>

            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding: var(--spacing-md);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:var(--text-xl); font-weight:var(--font-bold);">${completedTasks}</span>
                    <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:var(--font-semibold);">Completed</span>
                </div>
                <div style="width:40px; height:40px; border-radius:50%; background-color:#D1FAE5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:var(--text-lg);">
                    <i class="ph-fill ph-check-circle"></i>
                </div>
            </div>

            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding: var(--spacing-md);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:var(--text-xl); font-weight:var(--font-bold);">${attendancePercentage}%</span>
                    <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:var(--font-semibold);">Attendance %</span>
                </div>
                <div style="width:40px; height:40px; border-radius:50%; background-color:#F3F4F6; color:#4B5563; display:flex; align-items:center; justify-content:center; font-size:var(--text-lg);">
                    <i class="ph-fill ph-calendar-check"></i>
                </div>
            </div>

        </div>

        <!-- Assigned Tasks Summary -->
        <div class="card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-header">
                <h3 style="margin:0; font-size:var(--text-lg);">Assigned Tasks Summary</h3>
                <a href="#tasks" class="btn btn-outline" style="padding: 4px 8px; font-size: var(--text-xs);">View All</a>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-md); margin-top: var(--spacing-md);">
                ${tasks.map(t => `
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
                `).join('')}
                ${tasks.length === 0 ? '<div style="color:var(--text-muted); text-align:center; width:100%; padding: 20px;">No recent tasks.</div>' : ''}
            </div>
        </div>
        
        <!-- Bottom Halves (2-Column Grid) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
            
            <!-- Left Half: Attendance Box -->
            <div class="card">
                <div class="card-header">
                    <h3 style="margin:0; font-size:var(--text-lg);">Attendance Status</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: 10px;">
                    
                    <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--border-light);">
                        <span style="color: var(--text-muted);">Today's Status</span>
                        <span class="badge ${todayRecord ? 'badge-success' : 'badge-danger'}">${todayRecord ? 'Present' : 'Absent'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--border-light);">
                        <span style="color: var(--text-muted);">Check-In Time</span>
                        <span style="font-weight: var(--font-semibold);">${todayRecord ? todayRecord.check_in_time : '--:--'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--border-light);">
                        <span style="color: var(--text-muted);">Work Hours Built</span>
                        <span style="font-weight: var(--font-semibold);">${todayRecord ? (todayRecord.screen_time ? Math.round(todayRecord.screen_time / 60) + ' hrs' : 'Active') : '0 hrs'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; padding-top: 10px;">
                        <span style="color: var(--text-muted);">This Month</span>
                        <div style="text-align: right;">
                            <span style="font-weight: var(--font-bold); color: var(--primary-color); font-size: var(--text-lg);">${presentDays}</span>
                            <span style="font-size: var(--text-xs); color: var(--text-muted);"> / ${totalWorkingDays} Days Present</span>
                        </div>
                    </div>

                </div>
            </div>
            
            <!-- Right Half: Leave Requests Box -->
            <div class="card">
                <div class="card-header">
                    <h3 style="margin:0; font-size:var(--text-lg);">Recent Leave Requests</h3>
                </div>
                <ul style="margin-top: 10px;">
                    ${recentLeaves.map(l => `
                        <li style="padding: 12px 0; border-bottom: 1px solid var(--border-light); display:flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin:0; font-size: var(--text-sm);">${l.leave_type} Leave</h4>
                                <p style="margin:2px 0 0 0; font-size: var(--text-xs); color: var(--text-muted);">${l.start_date} to ${l.end_date}</p>
                            </div>
                            <span class="badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
                                ${l.status}
                            </span>
                        </li>
                    `).join('')}
                    ${recentLeaves.length === 0 ? '<li style="color:var(--text-muted); text-align:center; padding: 20px;">No leave requests filed.</li>' : ''}
                </ul>
            </div>

        </div>
    `;
}

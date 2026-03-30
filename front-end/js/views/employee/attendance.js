// /js/views/employee/attendance.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderEmployeeAttendance(container) {
    const user = auth.getCurrentUser();
    
    // Header
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Attendance</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">Employee Portal</span>
            </div>
        </div>
    `;

    // Fetch dependencies + Data
    const attendanceRecords = db.getAttendanceForUser(user.emp_id);
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRecord = attendanceRecords.find(a => a.attendance_date === todayStr);

    let isCheckedIn = !!(todaysRecord && todaysRecord.check_in_time && !todaysRecord.check_out_time);
    let isCheckedOut = !!(todaysRecord && todaysRecord.check_out_time);

    // Default modes
    let activeLocation = todaysRecord?.attendance_mode === "REMOTE" ? "Home" : "Office";

    // Summary Metrics Generic Calculation
    let todayStatusText = todaysRecord ? "Present" : "Absent";
    if(!todaysRecord) todayStatusText = "Pending";
    let statusColor = todaysRecord ? "var(--secondary-color)" : "var(--text-muted)";
    
    let hoursToday = todaysRecord?.hours_spent || "0h";
    let progressPerc = isCheckedIn ? 40 : (isCheckedOut ? 100 : 0);
    
    // History 
    let monthString = "5/6"; // Using dummy prompt metric explicitly assuming 6 work days mapped "this month"

    // Section 4 Analytics
    let attendanceRate = 95;
    let avgProgress = 72;
    let escalationCount = attendanceRecords.filter(a => a.status === 'ESCALATED').length;

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; display:flex; flex-direction:column; gap: 32px; padding-bottom: 40px;">
            
            <!-- SECTION 1: MARK ATTENDANCE -->
            <div class="card" style="padding: 24px; text-align:center; max-width: 600px; margin: 0 auto; width: 100%;">
                <h3 style="margin:0 0 8px 0; font-size:var(--text-lg);">Mark your Attendance</h3>
                <div style="color:var(--text-muted); font-size:var(--text-sm); margin-bottom: 24px;">Select your work location and mark check-in/check-out</div>
                
                <div style="margin-bottom: 24px;">
                    <div style="font-weight:var(--font-medium); margin-bottom:12px; font-size:var(--text-sm);">Work Location</div>
                    <div style="display:inline-flex; border: 1px solid var(--border-light); border-radius:var(--radius-full); padding: 4px; background-color: var(--bg-main);">
                        <button id="loc-office" class="location-toggle ${activeLocation === 'Office' ? 'active' : ''}" style="border:none;" ${isCheckedIn || isCheckedOut ? 'disabled' : ''}>Office</button>
                        <button id="loc-home" class="location-toggle ${activeLocation === 'Home' ? 'active' : ''}" style="border:none;" ${isCheckedIn || isCheckedOut ? 'disabled' : ''}>Home</button>
                    </div>
                </div>

                <div style="display:flex; justify-content:center; gap: 16px;">
                    <button id="btn-checkin" class="btn btn-purple ${isCheckedIn || isCheckedOut ? 'action-btn-disabled' : ''}" style="border-radius:var(--radius-full); padding: 12px 32px; min-width: 140px;">Check-in</button>
                    <button id="btn-checkout" class="btn btn-outline ${!isCheckedIn || isCheckedOut ? 'action-btn-disabled' : ''}" style="border-radius:var(--radius-full); padding: 12px 32px; min-width: 140px;">Check-out</button>
                </div>
            </div>

            <!-- SECTION 2: TODAY'S SUMMARY CARDS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <!-- Card 1 -->
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color:#D1FAE5; color:#10B981; display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-check-circle" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size:var(--text-lg); color:${statusColor};">${todayStatusText}</div>
                    <div style="font-size:12px; color:var(--text-muted);">Today's Status</div>
                </div>
                <!-- Card 2 -->
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color:var(--bg-main); color:var(--text-main); display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-clock" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size:var(--text-lg);">${hoursToday}</div>
                    <div style="font-size:12px; color:var(--text-muted);">Work Hours Today</div>
                </div>
                <!-- Card 3 -->
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-check-square-offset" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size:var(--text-lg); color:var(--primary-color);">${progressPerc}%</div>
                    <div style="font-size:12px; color:var(--text-muted);">Today's Progress</div>
                </div>
                <!-- Card 4 -->
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color:var(--bg-main); color:var(--text-main); display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-calendar-blank" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size:var(--text-lg);">${monthString}</div>
                    <div style="font-size:12px; color:var(--text-muted);">This Month</div>
                </div>
            </div>

            <!-- SECTION 3: MONTHLY ATTENDANCE RECORDS -->
            <div class="card table-modern" style="padding: 0; overflow:hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-light);">
                    <h3 style="margin:0; font-size:var(--text-lg);">Monthly Attendance Records</h3>
                </div>
                <div class="table-container" style="border-radius: var(--radius-md);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border-color);">
                                <th style="padding: 16px;">Date</th>
                                <th style="padding: 16px;">Status</th>
                                <th style="padding: 16px;">Hours Spent</th>
                                <th style="padding: 16px;">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendanceRecords.reverse().map(a => {
                                let badge = 'badge-not-started';
                                if(a.status === 'PRESENT') badge = 'badge-present';
                                if(a.status === 'ABSENT') badge = 'badge-absent';
                                if(a.status === 'WEEKEND') badge = 'badge-weekend';
                                if(a.status === 'ESCALATED') badge = 'badge-escalated';
                                
                                // Current day highlight row logic
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
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 4: PERFORMANCE METRICS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <!-- Rate Donut -->
                <div class="card" style="padding: 24px; text-align:center;">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="circle" stroke-dasharray="${attendanceRate}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" class="percentage">${attendanceRate}%</text>
                    </svg>
                    <div style="font-size: 14px; font-weight:var(--font-bold); margin-top: 16px;">Attendance Rate</div>
                </div>
                <!-- Avg -->
                <div class="card" style="padding: 24px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">${avgProgress}%</div>
                    <div style="font-size: 14px; font-weight:var(--font-bold); margin-bottom:4px;">Average Daily Progress</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Based on last 30 days</div>
                </div>
                <!-- Escalation -->
                <div class="card" style="padding: 24px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: #EA580C; margin-bottom:4px;">${escalationCount}</div>
                    <div style="font-size: 14px; font-weight:var(--font-bold); margin-bottom:4px;">Escalation Count</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Issues escalated this month</div>
                </div>
            </div>

        </div>
    `;

    // Interactive Listeners
    if (!isCheckedIn && !isCheckedOut) {
        // Toggle Logic
        document.getElementById('loc-office').addEventListener('click', (e) => {
            activeLocation = "Office";
            document.getElementById('loc-office').classList.add('active');
            document.getElementById('loc-home').classList.remove('active');
        });
        document.getElementById('loc-home').addEventListener('click', (e) => {
            activeLocation = "Home";
            document.getElementById('loc-home').classList.add('active');
            document.getElementById('loc-office').classList.remove('active');
        });

        // Checkin logic
        document.getElementById('btn-checkin').addEventListener('click', () => {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            
            // Generate in DB
            const res = db.markAttendance(user.emp_id, timeStr, activeLocation === "Home" ? "REMOTE" : "OFFICE");
            if(res && !res.error) {
                // Set remark explicitly representing DB bounds
                res.remarks = "Checked In";
                db.saveData();
                renderEmployeeAttendance(container);
            }
        });
    }

    if (isCheckedIn) {
        // Checkout logic
        document.getElementById('btn-checkout').addEventListener('click', () => {
            const res = db.markCheckOut(user.emp_id);
            if(res && !res.error) {
                res.remarks = "Completed";
                db.saveData();
                renderEmployeeAttendance(container);
            }
        });
    }
}

// /js/views/employee/work-logs.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderWorkLogs(container) {
    const user = auth.getCurrentUser();
    
    // Header Logic mapping
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Work Logs</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">Employee Portal</span>
            </div>
        </div>
    `;

    // Fetch dependencies
    const tasks = db.getTasksForUser(user.emp_id).filter(t => t.status !== 'COMPLETED');
    const logs = db.getWorkLogsForUser(user.emp_id);

    // Calculate generic metrics
    let totalLogsMonth = logs.length;
    let totalWeekHours = logs.reduce((sum, l) => sum + parseInt(l.hours_spent || 0), 0);
    let avgHours = (totalWeekHours / (totalLogsMonth || 1)).toFixed(1);

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; display:flex; flex-direction:column; gap: 32px; padding-bottom: 40px;">
            
            <!-- SECTION 1: LOG WORK ACTIVITY (FORM CARD) -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 24px 0; font-size:var(--text-lg); border-bottom:1px solid var(--border-light); padding-bottom:16px;">Log Work Activity</h3>
                <form id="work-log-form">
                    
                    <!-- Row 1 -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Task ID</label>
                            <select id="wl_task_id" class="form-control" style="border-radius: var(--radius-md); padding: 12px 16px;" required>
                                <option value="" disabled selected>Select assigned task</option>
                                ${tasks.map(t => `<option value="${t.task_id}" data-title="${t.task_title}">#${t.task_id} - ${t.task_title}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Hours Spent</label>
                            <input type="number" id="wl_hours" class="form-control" placeholder="Enter Hours" min="1" max="24" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Work Start Time</label>
                            <input type="datetime-local" id="wl_start" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Work End Time</label>
                            <input type="datetime-local" id="wl_end" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                        </div>
                    </div>

                    <!-- Row 3 -->
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight:var(--font-medium);">Work Description</label>
                        <textarea id="wl_desc" class="form-control" rows="4" placeholder="Describe the work completed in this session" required style="border-radius: var(--radius-md); padding: 16px; resize:vertical;"></textarea>
                    </div>

                    <!-- Primary Action -->
                    <button type="submit" class="btn btn-purple" style="width:100%; padding: 16px; font-size:var(--text-md); display:flex; justify-content:center; align-items:center; gap:10px; border-radius: 50px; box-shadow: 0 4px 6px rgba(91, 46, 255, 0.2);">
                        <i class="ph ph-floppy-disk" style="font-size:20px;"></i> Save Work Log
                    </button>
                </form>
            </div>

            <!-- SECTION 2: PREVIOUS WORK LOGS -->
            <div class="card table-modern" style="padding: 0; overflow:hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-light);">
                    <h3 style="margin:0; font-size:var(--text-lg);">Previous Work Logs</h3>
                </div>
                <div class="table-container" style="border-radius: var(--radius-md);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border-color);">
                                <th style="padding: 16px;">Log ID</th>
                                <th style="padding: 16px;">Task ID</th>
                                <th style="padding: 16px;">Task Title</th>
                                <th style="padding: 16px;">Start Time</th>
                                <th style="padding: 16px;">End Time</th>
                                <th style="padding: 16px;">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.reverse().map(l => `
                                <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
                                    <td style="padding: 16px;">
                                        <a href="#work-logs" style="color: #3B82F6; font-weight: var(--font-semibold); text-decoration: none;">#${l.worklog_id}</a>
                                    </td>
                                    <td style="padding: 16px;">
                                        <a href="#update-task/${l.task_id}" style="color: var(--text-main); font-weight: var(--font-medium); text-decoration: underline;">#${l.task_id}</a>
                                    </td>
                                    <td style="padding: 16px; min-width: 150px; white-space: normal; line-height:1.4;">
                                        ${l.task_title || "Generic Task"}
                                    </td>
                                    <td style="padding: 16px; color: var(--text-muted); font-size:12px;">${l.start_time.replace('T', ' ')}</td>
                                    <td style="padding: 16px; color: var(--text-muted); font-size:12px;">${l.end_time.replace('T', ' ')}</td>
                                    <td style="padding: 16px; color: var(--text-muted); font-size: 13px; max-width: 300px; line-height:1.4;">
                                        ${l.description}
                                    </td>
                                </tr>
                            `).join('')}
                            ${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--text-muted);">No logs found.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 3: SUMMARY METRICS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">${totalWeekHours}</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight:var(--font-medium);">Total Hours This Week</div>
                </div>
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">${totalLogsMonth}</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight:var(--font-medium);">Total Logs this Month</div>
                </div>
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">${avgHours}</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight:var(--font-medium);">Average Hours Per Day</div>
                </div>
            </div>

        </div>
    `;

    // Process Form Submit internally to trick table reload dynamically
    document.getElementById('work-log-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const taskDrop = document.getElementById('wl_task_id');
        const selectedOption = taskDrop.options[taskDrop.selectedIndex];
        
        const startTime = document.getElementById('wl_start').value;
        const endTime = document.getElementById('wl_end').value;

        if (new Date(endTime) <= new Date(startTime)) {
            alert("Error: Work End Time must be strictly greater than Work Start Time.");
            return;
        }

        db.createWorkLog({
            emp_id: user.emp_id,
            task_id: taskDrop.value,
            task_title: selectedOption.getAttribute('data-title'),
            hours_spent: document.getElementById('wl_hours').value,
            start_time: startTime,
            end_time: endTime,
            description: document.getElementById('wl_desc').value
        });
        
        // Re-render view locally to inject into table naturally
        renderWorkLogs(container);
    });
}

// /js/views/teamlead/tasks.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderTeamLeadTasks(container) {
    document.getElementById('page-title').textContent = "Work Allocation Manager";
    const user = auth.getCurrentUser();
    const teamMembers = db.getUsersByManager(user.emp_id);
    const allAssignedTasks = db.getAllTasksForManager(user.emp_id);
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-lg);">
            <!-- Allocate Work Form -->
            <div class="card" style="align-self: start;">
                <div class="card-header">
                    <h3>Assign New Task</h3>
                </div>
                <form id="assign-task-form">
                    <div class="form-group">
                        <label class="form-label">Assign To</label>
                        <select id="assign_to" class="form-control" required>
                            <option value="">-- Select Member --</option>
                            ${teamMembers.map(m => `<option value="${m.emp_id}">${m.emp_name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Task Title</label>
                        <input type="text" id="task_title" class="form-control" required placeholder="e.g. Generate weekly report">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Task Description</label>
                        <textarea id="task_desc" class="form-control" rows="3" required></textarea>
                    </div>

                    <div class="form-group" style="display:flex; gap:10px;">
                        <div style="flex:1;">
                            <label class="form-label">Priority</label>
                            <select id="priority" class="form-control" required>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM" selected>Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label class="form-label">Deadline</label>
                            <input type="date" id="deadline" class="form-control" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width:100%;">Create Task Allocation</button>
                    <div id="task-msg" style="color:var(--secondary-color); margin-top:10px; text-align:center; display:none;">Task Assigned!</div>
                </form>
            </div>
            
            <!-- Tracking List -->
            <div class="card">
                <div class="card-header">
                    <h3>Team Workload Tracker</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Assignee</th>
                                <th>Task Title</th>
                                <th>Priority</th>
                                <th>Due By</th>
                                <th>Status</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allAssignedTasks.sort((a,b)=>new Date(a.deadline) - new Date(b.deadline)).map(t => {
                                const emp = db.getUserById(t.assigned_to);
                                return `
                                    <tr>
                                        <td><strong>${emp.emp_name}</strong></td>
                                        <td>${t.task_title}</td>
                                        <td><span class="badge ${t.priority === 'HIGH' ? 'badge-danger' : 'badge-info'}">${t.priority}</span></td>
                                        <td>${t.deadline}</td>
                                        <td><span class="badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${t.status.replace('_', ' ')}</span></td>
                                        <td>
                                            <div style="width: 100%; background-color: var(--border-color); border-radius: 4px; overflow: hidden; height: 8px;">
                                                <div style="width: ${t.progress_percentage}%; background-color: ${t.progress_percentage === 100 ? 'var(--secondary-color)' : 'var(--primary-color)'}; height: 100%;"></div>
                                            </div>
                                            <span style="font-size:10px; color:var(--text-muted);">${t.progress_percentage}%</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                            ${allAssignedTasks.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No tasks currently assigned.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('assign-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        db.createTask({
            allocation_id: 'W' + Date.now(),
            assigned_to: document.getElementById('assign_to').value,
            task_title: document.getElementById('task_title').value,
            task_description: document.getElementById('task_desc').value,
            priority: document.getElementById('priority').value,
            deadline: document.getElementById('deadline').value
        });
        
        document.getElementById('task-msg').style.display = 'block';
        setTimeout(() => {
            renderTeamLeadTasks(container); // Refresh UI organically
        }, 1000);
    });
}

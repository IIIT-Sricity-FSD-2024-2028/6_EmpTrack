// /js/views/employee/update-task.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderUpdateTaskProgress(container, taskId) {
    const user = auth.getCurrentUser();
    const task = db.getTasksForUser(user.emp_id).find(t => t.task_id === taskId);
    
    if (!task) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px;">Task Not Found. <a href="#tasks">Return</a></div>`;
        return;
    }

    // Header updates natively outside container
    document.getElementById('page-title').innerHTML = `
        <a href="#tasks" style="color:var(--text-main); text-decoration:none; margin-right:15px;"><i class="ph ph-arrow-left"></i></a>
        Update Task Progress
    `;
    
    container.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto; border-radius: 12px; padding: 32px;">
            
            <!-- Task Info Section -->
            <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border-light);">
                <p style="font-size: var(--text-md); color: var(--text-main); line-height: 1.5; margin-bottom: 16px;">
                    ${task.task_description}
                </p>
                <div style="display:inline-block; background-color: var(--bg-surface); padding: 8px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light); font-size: var(--text-sm); color: var(--text-muted);">
                    <span style="font-weight:var(--font-semibold); color:var(--text-main);">Task ID:</span> ${task.task_id} 
                    <span style="margin: 0 10px; color: var(--border-color);">|</span> 
                    <span style="font-weight:var(--font-semibold); color:var(--text-main);">Estimated Hours:</span> ${task.est_hours || 40}h
                </div>
            </div>
            
            <form id="update-progress-form">
                <!-- Progress Section -->
                <div style="margin-bottom: 32px;">
                    <div style="display:flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-weight: var(--font-medium); color: var(--text-main);">Current Progress: <span style="color:var(--primary-color);">${task.progress_percentage}%</span></span>
                        <span style="font-weight: var(--font-medium); color: var(--text-main);">New Progress: <span id="progress-val-display" style="color:var(--primary-color);">${task.progress_percentage}%</span></span>
                    </div>
                    
                    <div style="position: relative; margin-bottom: 8px;">
                        <input type="range" id="progress-slider" min="0" max="100" value="${task.progress_percentage}" style="width: 100%; -webkit-appearance: none; appearance: none; height: 12px; border-radius: var(--radius-full); background: #E5E7EB; outline: none; z-index: 2; position: relative;">
                        <!-- Custom Purple Fill Track -->
                        <div id="progress-fill" style="position: absolute; top:0; left:0; height: 12px; border-radius: var(--radius-full); background-color: var(--primary-color); width: ${task.progress_percentage}%; z-index: 1; pointer-events:none;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--text-muted);">
                        <span>0%</span>
                        <span>25%</span>
                        <span>75%</span>
                        <span>100%</span>
                    </div>
                </div>

                <!-- Inputs Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Hours Spent (Today)</label>
                        <input type="number" id="hours_spent" class="form-control" placeholder="e.g. 4" style="border-radius: var(--radius-md); padding: 12px 16px;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Status</label>
                        <select id="status_input" class="form-control" style="border-radius: var(--radius-md); padding: 12px 16px;">
                            <option value="NOT_STARTED" ${task.status === 'NOT_STARTED' ? 'selected' : ''}>Not Started</option>
                            <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                            <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>

                <!-- Notes Section -->
                <div class="form-group" style="margin-bottom: 32px;">
                    <label class="form-label">Update Notes (Optional)</label>
                    <textarea id="update_notes" class="form-control" rows="4" placeholder="Describe what you've accomplished, any blockers, or next steps" style="border-radius: var(--radius-md); padding: 16px; resize:vertical;"></textarea>
                </div>

                <!-- Actions -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-light); padding-top: 24px;">
                    <button type="button" class="btn btn-outline" onclick="window.location.hash='#tasks'" style="border:none; color:var(--text-muted); font-weight:var(--font-medium);">Cancel</button>
                    <button type="submit" class="btn btn-purple" style="padding: 14px 32px; font-size: var(--text-md); display:flex; gap:8px; align-items:center;">
                        Update Progress <i class="ph ph-upload-simple" style="font-size:18px;"></i>
                    </button>
                </div>
            </form>
        </div>
    `;

    // Connect slider animation
    const slider = document.getElementById('progress-slider');
    const fill = document.getElementById('progress-fill');
    const display = document.getElementById('progress-val-display');

    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        fill.style.width = val + '%';
        display.textContent = val + '%';
        
        // Auto-change status via UI helper
        const statusEl = document.getElementById('status_input');
        if(val == 100) statusEl.value = 'COMPLETED';
        else if(val > 0 && statusEl.value === 'NOT_STARTED') statusEl.value = 'IN_PROGRESS';
    });

    // Form logic
    document.getElementById('update-progress-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newProgress = parseInt(slider.value, 10);
        const newStatus = document.getElementById('status_input').value;
        
        // Save to mock store
        db.updateTaskStatus(taskId, newStatus, newProgress);
        
        // Redirect back
        window.location.hash = '#tasks';
    });
}

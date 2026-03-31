// /js/views/employee/update-task.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js

    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('id');

    const task = db.getTasksForUser(user.emp_id).find(t => t.task_id === taskId);
    
    if (!task) {
        document.getElementById('task-error-container').style.display = 'block';
        return;
    }

    document.getElementById('task-content-container').style.display = 'block';

    // Populate Info
    document.getElementById('ut-desc').textContent = task.task_description;
    document.getElementById('ut-id').textContent = task.task_id;
    document.getElementById('ut-hours').textContent = task.est_hours || 40;
    
    document.getElementById('ut-current-progress').textContent = `${task.progress_percentage}%`;
    document.getElementById('progress-val-display').textContent = `${task.progress_percentage}%`;
    
    // Setup slider
    const slider = document.getElementById('progress-slider');
    const fill = document.getElementById('progress-fill');
    const display = document.getElementById('progress-val-display');
    const statusEl = document.getElementById('status_input');

    slider.value = task.progress_percentage;
    fill.style.width = task.progress_percentage + '%';
    
    // Set initial status dropdown
    statusEl.value = task.status;

    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        fill.style.width = val + '%';
        display.textContent = val + '%';
        
        if(val == 100) statusEl.value = 'COMPLETED';
        else if(val > 0 && statusEl.value === 'NOT_STARTED') statusEl.value = 'IN_PROGRESS';
    });

    // Form logic
    document.getElementById('update-progress-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newProgress = parseInt(slider.value, 10);
        const newStatus = statusEl.value;
        
        db.updateTaskStatus(taskId, newStatus, newProgress);
        window.location.href = 'tasks.html';
    });
});

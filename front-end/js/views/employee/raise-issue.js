// /js/views/employee/raise-issue.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const activeTasks = (await db.getTasksForUser(user.emp_id)).filter(t => t.status !== 'COMPLETED');
    const taskDrop = document.getElementById('related_task');
    if (taskDrop) {
        taskDrop.innerHTML = '<option value="">Select a task (if applicable)</option>' + 
            activeTasks.map(t => `<option value="${t.task_id}">#${t.task_id} - ${t.task_title}</option>`).join('');
    }

    const bindRadioGrid = (gridId, inputId) => {
        const grid = document.getElementById(gridId);
        const input = document.getElementById(inputId);
        if(!grid) return;
        const cards = grid.querySelectorAll('.radio-card');
        
        cards.forEach(card => {
            card.addEventListener('click', async () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                input.value = card.getAttribute('data-val');
            });
        });
    };

    bindRadioGrid('issue-type-grid', 'selected_type');
    bindRadioGrid('priority-grid', 'selected_priority');

    const form = document.getElementById('raise-issue-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await db.createIssue({
                emp_id: user.emp_id,
                type: document.getElementById('selected_type').value,
                priority: document.getElementById('selected_priority').value,
                related_task: document.getElementById('related_task').value,
                title: document.getElementById('title').value,
                description: document.getElementById('description').value
            });
            window.location.href = 'issues-list.html';
        });
    }
});

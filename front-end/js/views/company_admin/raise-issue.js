// /js/views/company_admin/raise-issue.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const grid = document.getElementById('priority-grid');
    const priorityInput = document.getElementById('selected_priority');
    grid.querySelectorAll('.radio-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            priorityInput.value = card.getAttribute('data-val');
        });
    });

    const errorEl = document.getElementById('raise-issue-error');
    const form = document.getElementById('raise-company-issue-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        try {
            await db.raiseCompanyIssue({
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                priority: priorityInput.value,
                category: document.getElementById('category').value || undefined
            });
            window.location.href = 'dashboard.html';
        } catch (err) {
            errorEl.textContent = err.message || 'Could not raise issue. Please try again.';
            errorEl.style.display = 'block';
        }
    });
});

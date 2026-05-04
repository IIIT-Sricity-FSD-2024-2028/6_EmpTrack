// /js/views/employee/leave.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { validate } from '../../utils/validate.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js

    async function renderHistory() {
        const leaves = (await db.getLeavesForUser(user.emp_id)).sort((a,b) => new Date(b.applied_date) - new Date(a.applied_date));
        const tbody = document.getElementById('leave-history-body');
        if (tbody) {
            tbody.innerHTML = leaves.map(l => `
                <tr style="border-bottom: 1px solid var(--border-light);">
                    <td style="padding: 12px;">${l.leave_type}</td>
                    <td style="padding: 12px;">${l.start_date} to ${l.end_date}</td>
                    <td style="padding: 12px;">${l.applied_date}</td>
                    <td style="padding: 12px;">
                        <span class="badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
                            ${l.status}
                        </span>
                    </td>
                </tr>
            `).join('');
            if (leaves.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-muted);">No leave requests found.</td></tr>';
        }
    }

    renderHistory();

    const form = document.getElementById('leave-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            
            const msg = document.getElementById('leave-msg');
            msg.style.display = 'none';

            if(!validate.isValidDateRange(start, end)) {
                msg.textContent = 'End date cannot be before Start date.';
                msg.style.display = 'block';
                return;
            }

            await db.createLeave({
                emp_id: user.emp_id,
                start_date: start,
                end_date: end,
                leave_type: document.getElementById('leaveType').value,
                reason: document.getElementById('reason').value
            });
            
            form.reset();
            renderHistory();
            await db.saveData();
        });
    }
});

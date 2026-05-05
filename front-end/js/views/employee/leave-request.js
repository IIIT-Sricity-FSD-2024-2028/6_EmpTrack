// /js/views/employee/leave-request.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    async function renderLeaves() {
        const leaves = await db.getLeavesForUser(user.emp_id);
        const tbody = document.getElementById('leave-req-body');
        if (tbody) {
            tbody.innerHTML = leaves.reverse().map(l => {
                let statBadge = 'badge-warning';
                if(l.status === 'APPROVED') statBadge = 'badge-success';
                if(l.status === 'REJECTED') statBadge = 'badge-danger';
                
                let typeBadge = 'badge-sick-leave';
                let typeLabel = 'Sick Leave';
                if(l.leave_type === 'CASUAL') { typeBadge = 'badge-vacation'; typeLabel = 'Vacation'; }
                if(l.leave_type === 'UNPAID') { typeBadge = 'badge-personal'; typeLabel = 'Personal Leave'; }

                return `
                <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
                    <td style="padding: 16px;"><span style="color:#3B82F6; font-weight:var(--font-medium);">${l.leave_id}</span></td>
                    <td style="padding: 16px;"><span class="badge ${typeBadge}">${typeLabel}</span></td>
                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${l.start_date}</td>
                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${l.end_date}</td>
                    <td style="padding: 16px;">${l.days || '-'}</td>
                    <td style="padding: 16px; font-size:13px; line-height:1.4;">
                        ${l.reason}
                        ${l.status === 'REJECTED' && l.reject_reason ? `<span class="leave-reject-reason" style="display:block; color:var(--danger-color); font-size:11px; margin-top:4px;">Reject reason: ${l.reject_reason}</span>` : ''}
                    </td>
                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${l.applied_date}</td>
                    <td style="padding: 16px;"><span class="badge ${statBadge}" style="text-transform:capitalize;">${l.status.toLowerCase()}</span></td>
                </tr>
                `;
            }).join('');
            
            if(leaves.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 32px; color: var(--text-muted);">No leave requests found.</td></tr>';
            }
        }
    }

    renderLeaves();

    const startObj = document.getElementById('lv_start');
    const endObj = document.getElementById('lv_end');
    const daysObj = document.getElementById('lv_days');

    async function calculateDays() {
        if(startObj && endObj && daysObj && startObj.value && endObj.value) {
            const d1 = new Date(startObj.value);
            const d2 = new Date(endObj.value);
            const diffTime = d2 - d1;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            if(diffDays > 0) {
                daysObj.value = diffDays;
            } else {
                daysObj.value = "";
            }
        }
    }
    
    if (startObj) startObj.addEventListener('change', calculateDays);
    if (endObj) endObj.addEventListener('change', calculateDays);

    const form = document.getElementById('leave-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const sD = new Date(startObj.value);
            const eD = new Date(endObj.value);

            if (eD < sD) {
                alert("Error: End date must be greater than or equal to the Start date.");
                return;
            }

            await db.createLeave({
                empId: user.emp_id,
                leave_type: document.getElementById('lv_type').value,
                days: daysObj.value,
                start_date: startObj.value,
                end_date: endObj.value,
                reason: document.getElementById('lv_reason').value,
                reject_reason: null
            });
            
            form.reset();
            renderLeaves();
        });
    }
});

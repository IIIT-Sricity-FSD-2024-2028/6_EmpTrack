// /js/views/teamlead/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js
    
    const nameEl = document.getElementById('tl-name');
    if (nameEl) nameEl.textContent = user.emp_name.split(' ')[0];

    // Toast Container Logic
    const toastContainer = document.getElementById('toast-container');
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.style.cssText = `
            background:${type === 'success' ? '#16A34A' : '#DC2626'};
            color:white;
            padding:12px 20px;
            border-radius:8px;
            font-weight:500;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.innerHTML = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const pendingContainer = document.getElementById('pending-approvals-container');

    async function renderPendingLeaves() {
        if (!pendingContainer) return;

        // Get members reporting to this Team Lead
        const teamMembers = await db.getUsersByManager(user.emp_id);
        const memberIds = teamMembers.map(m => m.emp_id);

        const allLeaves = await db.getAllLeaves();
        const pendingLeaves = allLeaves.filter(l => l.status === 'PENDING' && memberIds.includes(l.emp_id));

        if (pendingLeaves.length === 0) {
            pendingContainer.innerHTML = '<div style="color:var(--text-muted); font-size:var(--text-sm); margin-top:20px;">No pending approvals at this time.</div>';
            return;
        }

        pendingContainer.innerHTML = pendingLeaves.reverse().map(l => {
            const emp = teamMembers.find(m => m.emp_id === l.emp_id);
            const empName = emp ? emp.emp_name.split(' (')[0] : 'Employee';
            return `
                <div class="tl-approval-card" data-leave-id="${l.leave_id}">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <strong>${empName}</strong>
                        <span class="badge-pending">Pending</span>
                    </div>
                    <div style="font-size:var(--text-sm); color:var(--text-muted); margin-bottom:12px;">
                        Leave Request &bull; ${l.leave_type.charAt(0).toUpperCase() + l.leave_type.slice(1).toLowerCase()} &bull; ${l.applied_date}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary btn-approve" data-id="${l.leave_id}" style="flex:1; background-color:#16A34A; padding:6px; font-size:var(--text-sm);">Approve</button>
                        <button class="btn btn-danger btn-reject" data-id="${l.leave_id}" style="flex:1; padding:6px; font-size:var(--text-sm);">Reject</button>
                    </div>
                </div>
            `;
        }).join('');

        attachApprovalListeners();
    }

    async function attachApprovalListeners() {
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const leaveId = e.target.getAttribute('data-id');
                if (leaveId) {
                    await db.updateLeaveStatus(leaveId, 'APPROVED', user.emp_id);
                    renderPendingLeaves();
                    showToast("Request Approved", "success");
                }
            });
        });

        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const leaveId = e.target.getAttribute('data-id');
                if (leaveId) {
                    await db.updateLeaveStatus(leaveId, 'REJECTED', user.emp_id);
                    renderPendingLeaves();
                    showToast("Request Rejected", "danger");
                }
            });
        });
    }

    renderPendingLeaves();
});

// /js/views/teamlead/leave.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderTeamLeadLeave(container) {
    document.getElementById('page-title').textContent = "Leave Approvals";
    const user = auth.getCurrentUser();
    
    // Get all team members, then filter leaves
    const teamIds = db.getUsersByManager(user.emp_id).map(m => m.emp_id);
    const leaves = db.getAllLeaves().filter(l => teamIds.includes(l.emp_id)).sort((a,b) => new Date(b.applied_date) - new Date(a.applied_date));
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Pending & Resolved Requests</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Dates</th>
                            <th>Type</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leaves.map(l => {
                            const emp = db.getUserById(l.emp_id);
                            return `
                                <tr>
                                    <td>${emp.emp_name} (${l.emp_id})</td>
                                    <td>${l.start_date} to ${l.end_date}</td>
                                    <td><span class="badge badge-info">${l.leave_type}</span></td>
                                    <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${l.reason}">${l.reason}</td>
                                    <td><span class="badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">${l.status}</span></td>
                                    <td>
                                        ${l.status === 'PENDING' ? `
                                            <div style="display:flex; gap:5px;">
                                                <button class="btn btn-primary leave-action" data-id="${l.leave_id}" data-action="APPROVED" style="padding:4px 8px; font-size:var(--text-xs);">Approve</button>
                                                <button class="btn btn-danger leave-action" data-id="${l.leave_id}" data-action="REJECTED" style="padding:4px 8px; font-size:var(--text-xs);">Reject</button>
                                            </div>
                                        ` : `Handled on ${l.approved_date}`}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelectorAll('.leave-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const leaveId = e.target.getAttribute('data-id');
            const action = e.target.getAttribute('data-action');
            db.updateLeaveStatus(leaveId, action, user.emp_id);
            renderTeamLeadLeave(container); // Refresh UI natively
        });
    });
}

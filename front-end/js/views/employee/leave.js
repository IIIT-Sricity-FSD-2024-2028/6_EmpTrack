// /js/views/employee/leave.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { validate } from '../../utils/validate.js';

export function renderEmployeeLeave(container) {
    document.getElementById('page-title').textContent = "Leave Management";
    const user = auth.getCurrentUser();
    const leaves = db.getLeavesForUser(user.emp_id).sort((a,b) => new Date(b.applied_date) - new Date(a.applied_date));
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-lg);">
            <!-- Apply Leave Form -->
            <div class="card">
                <div class="card-header">
                    <h3>Apply for Leave</h3>
                </div>
                <form id="leave-form">
                    <div class="form-group">
                        <label class="form-label">Leave Type</label>
                        <select id="leaveType" class="form-control">
                            <option value="CASUAL">Casual Leave</option>
                            <option value="SICK">Sick Leave</option>
                            <option value="PAID">Paid Leave</option>
                            <option value="UNPAID">Unpaid Leave</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" id="startDate" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="date" id="endDate" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Reason</label>
                        <textarea id="reason" class="form-control" rows="3" required></textarea>
                    </div>
                    
                    <div id="leave-msg" class="form-error" style="display:none; margin-bottom:10px;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Submit Request</button>
                </form>
            </div>
            
            <!-- History Table -->
            <div class="card">
                <div class="card-header">
                    <h3>My Leave History</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Duration</th>
                                <th>Applied On</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaves.map(l => `
                                <tr>
                                    <td>${l.leave_type}</td>
                                    <td>${l.start_date} to ${l.end_date}</td>
                                    <td>${l.applied_date}</td>
                                    <td>
                                        <span class="badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
                                            ${l.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                            ${leaves.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No leave requests found.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const form = document.getElementById('leave-form');
    form.addEventListener('submit', (e) => {
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

        db.createLeave({
            emp_id: user.emp_id,
            start_date: start,
            end_date: end,
            leave_type: document.getElementById('leaveType').value,
            reason: document.getElementById('reason').value
        });
        
        renderEmployeeLeave(container); // Refresh UI
    });
}

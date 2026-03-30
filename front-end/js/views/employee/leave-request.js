// /js/views/employee/leave-request.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderLeaveRequest(container) {
    const user = auth.getCurrentUser();
    
    // Header Logic
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Leave Request</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">Employee Portal</span>
            </div>
        </div>
    `;

    const leaves = db.getLeavesForUser(user.emp_id);

    // Hardcoded prompt metrics
    const totalLeave = 24;
    const used = 8;
    const pending = 2;
    const remaining = 14;

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; display:flex; flex-direction:column; gap: 32px; padding-bottom: 40px;">
            
            <!-- SECTION 1: POLICY INFORMATION -->
            <div class="card" style="padding: 24px; background-color: #F8FAFC; border-color: #E2E8F0; display:flex; gap: 16px;">
                <div style="color:var(--warning-color); font-size: 24px;">
                    <i class="ph-fill ph-warning-circle"></i>
                </div>
                <div>
                    <h3 style="margin:0 0 12px 0; font-size:var(--text-md); color:#1E293B;">Important: Unauthorized Absence Policy</h3>
                    <ul style="margin:0; padding-left: 20px; color:#475569; font-size:13px; line-height:1.6;">
                        <li>Taking leave without Team Lead approval → escalation to HR</li>
                        <li>All leave requests must be approved in advance</li>
                        <li>Unauthorized absence will be flagged</li>
                        <li>HR notified for unapproved leaves</li>
                        <li>Repeated violations → disciplinary action</li>
                        <li>Emergency cases must be communicated immediately</li>
                    </ul>
                </div>
            </div>

            <!-- SECTION 2: LEAVE SUMMARY CARDS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:var(--bg-main); color:var(--text-main); display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-calendar-blank" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size: 32px;">${totalLeave}</div>
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Total Leave</div>
                </div>
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:#D1FAE5; color:#059669; display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-check-circle" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size: 32px; color:#059669;">${used}</div>
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Used</div>
                </div>
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:#FFEDD5; color:#EA580C; display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-clock-counter-clockwise" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size: 32px; color:#EA580C;">${pending}</div>
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Pending</div>
                </div>
                <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap: 10px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center;">
                        <i class="ph-fill ph-identification-badge" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:bold; font-size: 32px; color:var(--primary-color);">${remaining}</div>
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium);">Remaining</div>
                </div>
            </div>

            <!-- SECTION 3: APPLY FOR LEAVE -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 24px 0; font-size:var(--text-lg); border-bottom:1px solid var(--border-light); padding-bottom:16px;">Apply for Leave</h3>
                <form id="leave-form">
                    
                    <!-- Row 1 -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Leave Type</label>
                            <select id="lv_type" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                                <option value="" disabled selected>Enter leave type</option>
                                <option value="CASUAL">Vacation</option>
                                <option value="SICK">Sick Leave</option>
                                <option value="UNPAID">Personal Leave</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Number of Days</label>
                            <input type="number" id="lv_days" class="form-control" placeholder="Enter number of days" min="1" required style="border-radius: var(--radius-md); padding: 12px 16px; background-color:#F8FAFC;" readonly>
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">Start Date</label>
                            <input type="date" id="lv_start" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:var(--font-medium);">End Date</label>
                            <input type="date" id="lv_end" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                        </div>
                    </div>

                    <!-- Row 3 -->
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight:var(--font-medium);">Reason for Leave</label>
                        <textarea id="lv_reason" class="form-control" rows="4" placeholder="Give the reason for the leave..." required style="border-radius: var(--radius-md); padding: 16px; resize:vertical;"></textarea>
                    </div>

                    <!-- Action -->
                    <button type="submit" class="btn btn-purple" style="width:100%; padding: 16px; font-size:var(--text-md); display:flex; justify-content:center; align-items:center; gap:10px; border-radius: 50px;">
                        <i class="ph ph-paper-plane-right" style="font-size:20px;"></i> Submit Leave Request
                    </button>
                </form>
            </div>

            <!-- SECTION 4: MY LEAVE REQUESTS -->
            <div class="card table-modern" style="padding: 0; overflow:hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-light);">
                    <h3 style="margin:0; font-size:var(--text-lg);">My Leave Requests</h3>
                </div>
                <div class="table-container" style="border-radius: var(--radius-md);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border-color);">
                                <th style="padding: 16px;">Leave ID</th>
                                <th style="padding: 16px;">Leave Type</th>
                                <th style="padding: 16px;">Start Date</th>
                                <th style="padding: 16px;">End Date</th>
                                <th style="padding: 16px;">Days</th>
                                <th style="padding: 16px; width:25%;">Reason</th>
                                <th style="padding: 16px;">Applied On</th>
                                <th style="padding: 16px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaves.reverse().map(l => {
                                // Status badge
                                let statBadge = 'badge-warning';
                                if(l.status === 'APPROVED') statBadge = 'badge-success';
                                if(l.status === 'REJECTED') statBadge = 'badge-rejected';
                                
                                // Type badge
                                let typeBadge = 'badge-sick-leave';
                                let typeLabel = 'Sick Leave';
                                if(l.leave_type === 'CASUAL') { typeBadge = 'badge-vacation'; typeLabel = 'Vacation'; }
                                if(l.leave_type === 'UNPAID') { typeBadge = 'badge-personal'; typeLabel = 'Personal Leave'; }

                                return `
                                <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
                                    <td style="padding: 16px;"><a href="#" style="color:#3B82F6; font-weight:var(--font-medium); text-decoration:none;">${l.leave_id}</a></td>
                                    <td style="padding: 16px;"><span class="badge ${typeBadge}">${typeLabel}</span></td>
                                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${l.start_date}</td>
                                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${l.end_date}</td>
                                    <td style="padding: 16px;">${l.days || '-'}</td>
                                    <td style="padding: 16px; font-size:13px; line-height:1.4;">
                                        ${l.reason}
                                        ${l.status === 'REJECTED' && l.reject_reason ? `<span class="leave-reject-reason">Reject reason: ${l.reject_reason}</span>` : ''}
                                    </td>
                                    <td style="padding: 16px; color:var(--text-muted); font-size:13px;">${l.applied_date}</td>
                                    <td style="padding: 16px;"><span class="badge ${statBadge}" style="text-transform:capitalize;">${l.status.toLowerCase()}</span></td>
                                </tr>
                                `;
                            }).join('')}
                            ${leaves.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding: 32px; color: var(--text-muted);">No leave requests found.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;

    // Interactive Math: Date Offset -> Days
    const startObj = document.getElementById('lv_start');
    const endObj = document.getElementById('lv_end');
    const daysObj = document.getElementById('lv_days');

    function calculateDays() {
        if(startObj.value && endObj.value) {
            const d1 = new Date(startObj.value);
            const d2 = new Date(endObj.value);
            const diffTime = d2 - d1;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive boundary
            if(diffDays > 0) {
                daysObj.value = diffDays;
            } else {
                daysObj.value = "";
            }
        }
    }
    startObj.addEventListener('change', calculateDays);
    endObj.addEventListener('change', calculateDays);

    // Submission Form Validation interceptor
    document.getElementById('leave-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const sD = new Date(startObj.value);
        const eD = new Date(endObj.value);

        if (eD < sD) {
            alert("Error: End date must be greater than or equal to the Start date.");
            return;
        }

        db.createLeave({
            emp_id: user.emp_id,
            leave_type: document.getElementById('lv_type').value,
            days: daysObj.value,
            start_date: startObj.value,
            end_date: endObj.value,
            reason: document.getElementById('lv_reason').value,
            reject_reason: null
        });

        // Loop internal state organically
        renderLeaveRequest(container);
    });
}

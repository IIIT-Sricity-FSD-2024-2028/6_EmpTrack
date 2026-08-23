// /js/views/teamlead/assign-issue.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const urlParams = new URLSearchParams(window.location.search);
    const issueId = urlParams.get('id');

    const container = document.getElementById('assign-issue-container');

    const issueArray = await db.getAllIssues().catch(() => []);
    const issueData = issueArray.find(i => i.issue_id === issueId);

    if (!issueData) {
        container.style.display = 'block';
        container.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px; width: 100%;">
                <h2>Issue Not Found</h2>
                <p style="color:var(--text-muted);">The requested issue ${issueId} could not be located.</p>
                <a href="issue-management.html" class="btn btn-primary" style="margin-top:20px; text-decoration:none; display:inline-block;">Return to Tracker</a>
            </div>
        `;
        return;
    }

    const empRef = await db.getUserById(issueData.emp_id);
    const empNameNode = empRef ? empRef.emp_name : "Unknown Employee";

    let badgePri = 'badge-low';
    if(issueData.priority === 'Medium') badgePri = 'badge-medium';
    if(issueData.priority === 'High') badgePri = 'badge-high';

    let statBadge = 'badge-open';
    if(issueData.status === 'In Progress') statBadge = 'badge-info';
    if(issueData.status === 'Resolved') statBadge = 'badge-completed';

    container.innerHTML = `
        <!-- LEFT PANEL: ISSUE DETAILS -->
        <div style="display:flex; flex-direction:column; gap: 16px;">
            
            <!-- Main Info Card -->
            <div class="card" style="padding: 24px; background-color: var(--bg-surface);">
                <h3 style="margin:0 0 16px 0; color:var(--primary-color); font-size:var(--text-lg);">${issueData.issue_id}</h3>
                <h4 style="margin:0 0 8px 0; font-size: 20px; font-weight:var(--font-bold); color:var(--text-main);">${issueData.title}</h4>
                <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin:0 0 24px 0; padding-bottom:16px; border-bottom:1px solid var(--border-color);">
                    ${issueData.description || 'No detailed description provided by the reporter.'}
                </p>
                
                <!-- Metadata Grid -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    
                    <!-- Left Block -->
                    <div style="display:flex; flex-direction:column; gap: 16px;">
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Reported By</div>
                            <div style="font-weight:var(--font-medium); font-size:14px; color:var(--text-main);">${empNameNode}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Related Task</div>
                            <div style="font-weight:var(--font-medium); font-size:14px; color:var(--primary-color);">${issueData.related_task || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Priority</div>
                            <span class="badge ${badgePri}">${issueData.priority}</span>
                        </div>
                    </div>

                    <!-- Right Block -->
                    <div style="display:flex; flex-direction:column; gap: 16px;">
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Employee ID</div>
                            <div style="font-weight:var(--font-medium); font-size:14px; color:var(--text-main);">${issueData.emp_id}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Created Date</div>
                            <div style="font-weight:var(--font-medium); font-size:14px; color:var(--text-main);">${issueData.raised_date || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Current Status</div>
                            <span class="badge ${statBadge}">${issueData.status}</span>
                        </div>
                    </div>

                </div>
                
                <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border-color);">
                    <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Current Assignment</div>
                    <div style="font-weight:var(--font-medium); font-size:14px; color:var(--text-muted); font-style:italic;">${issueData.assigned_to === 'Unassigned' ? 'Unassigned' : issueData.assigned_to}</div>
                </div>
            </div>

            <!-- Assignment Tips -->
            <div class="card" style="padding: 20px; background-color: var(--bg-main); border:1px solid var(--border-color);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom: 12px; color:var(--primary-color);">
                    <i class="ph-fill ph-lightbulb" style="font-size:20px;"></i>
                    <h4 style="margin:0; font-size:14px; font-weight:var(--font-bold); color:var(--text-main);">Assignment Tips</h4>
                </div>
                <ul style="margin:0; padding-left: 20px; color:var(--text-muted); font-size:13px; line-height:1.6;">
                    <li>Choose appropriate team/individual</li>
                    <li>Set realistic deadlines</li>
                    <li>Add clear instructions</li>
                </ul>
            </div>

        </div>

        <!-- RIGHT PANEL: ASSIGNMENT FORM -->
        <div class="card" style="padding: 0; overflow:hidden; display:flex; flex-direction:column;">
            
            <!-- Purple Header Area -->
            <div style="background: linear-gradient(to right, var(--primary-color), #4F46E5); padding: 24px; color: white;">
                <h3 style="margin:0 0 4px 0; font-size: 20px; font-weight:var(--font-bold);">Assignment Form</h3>
                <div style="font-size: 13px; opacity: 0.9;">Fill in the details to assign this issue</div>
            </div>

            <div style="padding: 24px;">
                <form id="assign-issue-form">
                    <div class="form-group">
                        <label class="form-label">Assignment Type</label>
                        <select id="assign_type" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px; background-color:var(--bg-main);">
                            <option value="" disabled selected>Select execution scope...</option>
                            <option value="Individual">Individual Contributor</option>
                            <option value="Team">Team / Squad Request</option>
                            <option value="External">External Vendor</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Select Team / Assigned Node</label>
                        <select id="assign_target" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px; background-color:var(--bg-main);">
                            <option value="" disabled selected>Route issue to...</option>
                            <option value="Tech Support">Tech Support</option>
                            <option value="DevOps Team">DevOps Team</option>
                            <option value="HR001">Super Admin (HR001)</option>
                            <option value="EM002">Jane Smith (EM002)</option>
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Priority Override</label>
                            <select id="assign_prio" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px; background-color:var(--bg-main);">
                                <option value="High" ${issueData.priority === 'High' ? 'selected' : ''}>High</option>
                                <option value="Medium" ${issueData.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                <option value="Low" ${issueData.priority === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Resolution Deadline</label>
                            <input type="date" id="assign_date" class="form-control" required style="border-radius: var(--radius-md); padding: 12px 16px; background-color:var(--bg-main);">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 32px;">
                        <label class="form-label">Assignment Notes</label>
                        <textarea id="assign_notes" class="form-control" rows="4" placeholder="Inject explicit directives for the team..." required style="border-radius: var(--radius-md); padding: 16px; background-color:var(--bg-main); resize:vertical;"></textarea>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display:flex; gap: 16px; align-items:center;">
                        <button type="submit" class="btn btn-purple" style="flex:2; padding: 14px; font-size:14px; justify-content:center; box-shadow: var(--shadow-sm);">
                            Assign Issue
                        </button>
                        <a href="issue-management.html" class="btn btn-outline" style="flex:1; padding: 14px; justify-content:center; text-decoration:none; border-radius: var(--radius-full); background-color:var(--border-light); border:none; color:var(--text-muted);">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('assign-issue-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const assigned_to = document.getElementById('assign_target').value;
        const priority = document.getElementById('assign_prio').value;
        
        const updates = issueData.updates || [];
        updates.push({
            sender: user.emp_id,
            time: new Date().toISOString().split('T')[0],
            message: `Assigned to ${assigned_to}: ${document.getElementById('assign_notes').value}`
        });

        const btn = e.submitter;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Saving...';
        btn.disabled = true;

        try {
            await db.updateIssue(issueId, {
                assigned_to: assigned_to,
                priority: priority,
                status: 'In Progress',
                updates: updates
            });
        } catch(err) {
            console.error("Failed to assign issue", err);
            alert("Failed to assign issue");
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        window.location.href = 'issue-management.html';
    });
});


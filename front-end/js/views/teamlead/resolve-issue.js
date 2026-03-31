// /js/views/teamlead/resolve-issue.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const issueId = urlParams.get('id');

    const container = document.getElementById('resolve-issue-container');

    const issueArray = db.data.issue || [];
    const issueData = issueArray.find(i => i.issue_id === issueId);

    if (!issueData) {
        container.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px;">
                <h2>Issue Not Found</h2>
                <p style="color:var(--text-muted);">The requested issue ${issueId || 'undefined'} could not be located.</p>
                <a href="issue-management.html" class="btn btn-primary" style="margin-top:20px; text-decoration:none; display:inline-block;">Return to Tracker</a>
            </div>
        `;
        return;
    }

    const raisedDate = issueData.raised_date ? new Date(issueData.raised_date) : new Date();
    const daysOpen = Math.max(0, Math.floor((new Date() - raisedDate) / (1000 * 60 * 60 * 24)));

    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; align-items:center; gap: 12px;">
                <a href="issue-management.html" style="color:var(--text-main); font-size:20px; display:flex; align-items:center; padding:4px; text-decoration:none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--text-main)'">
                    <i class="ph-bold ph-arrow-left"></i>
                </a>
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Resolve Issue / Take Action</span>
            </div>
            <div style="font-size:13px; color:var(--text-muted); background:var(--bg-surface); padding: 4px 12px; border-radius:var(--radius-full); border:1px solid var(--border-color);">
                ${daysOpen === 0 ? 'Opened today' : `Open for ${daysOpen} day${daysOpen > 1 ? 's' : ''}`}
            </div>
        </div>
    `;

    const empRef = db.getUserById(issueData.emp_id);
    const empNameNode = empRef ? empRef.emp_name : "Unknown Employee";

    let badgePri = 'badge-low';
    if(issueData.priority === 'Medium') badgePri = 'badge-medium';
    if(issueData.priority === 'High') badgePri = 'badge-high';

    let statBadge = 'badge-open';
    if(issueData.status === 'In Progress') statBadge = 'badge-info';
    if(issueData.status === 'Resolved') statBadge = 'badge-completed';

    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; display:grid; grid-template-columns: 2fr 1fr; gap: 24px; padding-bottom: 40px; align-items: start;">
            
            <!-- LEFT PANEL -->
            <div style="display:flex; flex-direction:column; gap: 24px;">
                
                <!-- Issue Summary -->
                <div class="card" style="padding: 24px; background-color: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                        <div>
                            <h3 style="margin:0 0 4px 0; color:var(--primary-color); font-size:14px; font-weight:var(--font-bold); text-transform:uppercase;">${issueData.issue_id}</h3>
                            <h4 style="margin:0; font-size: 20px; font-weight:var(--font-bold); color:#1E293B;">${issueData.title}</h4>
                        </div>
                        <span class="badge ${statBadge}">${issueData.status}</span>
                    </div>
                    
                    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 24px 0; padding-bottom:16px; border-bottom:1px solid #E2E8F0;">
                        ${issueData.description || 'No detailed description provided by the reporter.'}
                    </p>
                    
                    <!-- Metadata Grid -->
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Reported By</div>
                            <div style="font-weight:var(--font-medium); font-size:13px; color:#334155;">${empNameNode} (${issueData.emp_id})</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Related Task</div>
                            <div style="font-weight:var(--font-medium); font-size:13px; color:var(--primary-color);">${issueData.related_task || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Priority</div>
                            <span class="badge ${badgePri}" style="font-size:11px; padding:2px 8px;">${issueData.priority}</span>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Assigned To</div>
                            <div style="font-weight:var(--font-medium); font-size:13px; color:#334155;">${issueData.assigned_to || 'Unassigned'}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Deadline</div>
                            <div style="font-weight:var(--font-medium); font-size:13px; color:#334155;">${issueData.deadline || 'Not Set'}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top:20px; padding-top:16px; border-top:1px dashed #E2E8F0; background-color:#F8FAFC; border-radius:8px; padding:16px;">
                        <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                            <i class="ph-fill ph-note-pencil"></i> Assignment Notes
                        </div>
                        <div style="font-weight:var(--font-medium); font-size:13px; color:#64748B; font-style:italic;">
                            ${issueData.assignment_notes || 'No specific assignment notes provided.'}
                        </div>
                    </div>
                </div>

                <!-- Resolution Form -->
                <div class="card" style="padding: 0; overflow:hidden; border:1px solid #E2E8F0;">
                    <div style="background: linear-gradient(to right, #10B981, #059669); padding: 20px 24px; color: white; display:flex; align-items:center; gap:12px;">
                        <i class="ph-fill ph-check-square-offset" style="font-size:24px;"></i>
                        <div>
                            <h3 style="margin:0 0 4px 0; font-size: 18px; font-weight:var(--font-bold);">Resolution Form</h3>
                            <div style="font-size: 13px; opacity: 0.9;">Document fix details to resolve issue cleanly</div>
                        </div>
                    </div>
                    
                    <form id="resolve-issue-form" style="padding: 24px; display:flex; flex-direction:column; gap:20px;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label">Resolution Type</label>
                                <select id="res_type" class="form-control" required style="background-color:#F8FAFC;">
                                    <option value="" disabled selected>Select how it was resolved...</option>
                                    <option value="Bug Fix">Bug Fix / Patch applied</option>
                                    <option value="Configuration">Configuration Change</option>
                                    <option value="Workaround">Workaround Provided</option>
                                    <option value="User Error">User Error / Training Given</option>
                                    <option value="Not a Bug">Not a Bug / Expected Behavior</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label">Time Spent (Hours)</label>
                                <input type="number" step="0.5" id="res_time" class="form-control" required min="0" placeholder="e.g. 2.5" style="background-color:#F8FAFC;">
                            </div>
                        </div>

                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Resolution Summary</label>
                            <textarea id="res_summary" class="form-control" rows="2" placeholder="Brief 1-sentence summary of the fix..." required style="background-color:#F8FAFC; resize:vertical;"></textarea>
                        </div>
                        
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Actions Taken</label>
                            <textarea id="res_actions" class="form-control" rows="3" placeholder="Step-by-step what was done to fix it..." required style="background-color:#F8FAFC; resize:vertical;"></textarea>
                        </div>
                        
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Root Cause Analysis</label>
                            <textarea id="res_root_cause" class="form-control" rows="2" placeholder="Why did this issue occur in the first place?" required style="background-color:#F8FAFC; resize:vertical;"></textarea>
                        </div>

                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Preventive Measures</label>
                            <textarea id="res_preventive" class="form-control" rows="2" placeholder="How to prevent this in the future..." style="background-color:#F8FAFC; resize:vertical;"></textarea>
                        </div>

                        <!-- Drag & Drop File Upload -->
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Supporting Evidence (Optional)</label>
                            <div style="border: 2px dashed #CBD5E1; border-radius: 8px; padding: 24px; text-align: center; background-color: #F8FAFC; transition: border-color 0.2s; cursor: pointer;" onmouseover="this.style.borderColor='var(--primary-color)'" onmouseout="this.style.borderColor='#CBD5E1'">
                                <i class="ph ph-upload-simple" style="font-size:32px; color:var(--text-muted); margin-bottom:8px;"></i>
                                <div style="font-size:14px; font-weight:var(--font-medium); color:#334155;">Click to upload or drag & drop</div>
                                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Logs, screenshots, or code diffs (max 5MB)</div>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin:0;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" id="res_followup" style="width:16px; height:16px; cursor:pointer; accent-color:#10B981;">
                                <span style="font-size:14px; font-weight:var(--font-medium); color:#334155;">Follow-up Required with Reporter</span>
                            </label>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display:flex; gap: 16px; align-items:center; margin-top:16px;">
                            <button type="submit" class="btn" style="background-color:#10B981; color:white; flex:2; padding: 14px; font-size:14px; font-weight:var(--font-bold); justify-content:center; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
                                Mark as Resolved
                            </button>
                            <a href="issue-management.html" class="btn btn-outline" style="flex:1; padding: 14px; justify-content:center; text-decoration:none; border-radius: var(--radius-full); background-color:#F1F5F9; border:none; color:#475569;">
                                Cancel
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            <!-- RIGHT PANEL: TIMELINE & INSIGHTS -->
            <div style="display:flex; flex-direction:column; gap: 24px;">
                
                <!-- Timeline -->
                <div class="card" style="padding: 24px;">
                    <h3 style="margin:0 0 20px 0; font-size:16px; font-weight:var(--font-bold); color:#1E293B; display:flex; align-items:center; gap:8px;">
                        <i class="ph-fill ph-clock-counter-clockwise" style="color:var(--primary-color);"></i> Issue Timeline
                    </h3>
                    
                    <div style="display:flex; flex-direction:column; gap:20px; position:relative;">
                        <div style="position:absolute; left:11px; top:12px; bottom:12px; width:2px; background-color:#E2E8F0; z-index:0;"></div>
                        
                        <div style="display:flex; gap:16px; position:relative; z-index:1;">
                            <div style="width:24px; height:24px; border-radius:50%; background-color:white; border:2px solid #10B981; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <div style="width:10px; height:10px; border-radius:50%; background-color:#10B981;"></div>
                            </div>
                            <div>
                                <div style="font-size:13px; font-weight:var(--font-bold); color:#334155;">Created</div>
                                <div style="font-size:12px; color:var(--text-muted);">${issueData.raised_date || 'Unknown Date'}</div>
                            </div>
                        </div>
                        
                        <div style="display:flex; gap:16px; position:relative; z-index:1;">
                            <div style="width:24px; height:24px; border-radius:50%; background-color:white; border:2px solid #3B82F6; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <div style="width:10px; height:10px; border-radius:50%; background-color:#3B82F6;"></div>
                            </div>
                            <div>
                                <div style="font-size:13px; font-weight:var(--font-bold); color:#334155;">Assigned</div>
                                <div style="font-size:12px; color:var(--text-muted);">${issueData.assigned_to ? 'Completed' : 'Skipped'}</div>
                            </div>
                        </div>
                        
                        <div style="display:flex; gap:16px; position:relative; z-index:1;">
                            <div style="width:24px; height:24px; border-radius:50%; background-color:white; border:2px solid #F59E0B; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <div style="width:10px; height:10px; border-radius:50%; background-color:#F59E0B;"></div>
                            </div>
                            <div>
                                <div style="font-size:13px; font-weight:var(--font-bold); color:#334155;">In Progress</div>
                                <div style="font-size:12px; color:var(--text-muted);">Started working</div>
                            </div>
                        </div>

                        <div style="display:flex; gap:16px; position:relative; z-index:1;">
                            <div style="width:24px; height:24px; border-radius:50%; background-color:white; border:2px solid #E2E8F0; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <div style="width:10px; height:10px; border-radius:50%; background-color:var(--text-muted);"></div>
                            </div>
                            <div>
                                <div style="font-size:13px; font-weight:var(--font-bold); color:var(--text-muted);">Resolution Pending</div>
                                <div style="font-size:12px; color:var(--text-muted);">Awaiting action</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Best Practices Card -->
                <div class="card" style="padding: 24px; background-color: #EEF2FF; border:1px solid #C7D2FE;">
                    <h3 style="margin:0 0 12px 0; font-size:14px; font-weight:var(--font-bold); color:#3730A3; display:flex; align-items:center; gap:8px;">
                        <i class="ph-fill ph-info"></i> Best Practices
                    </h3>
                    <ul style="margin:0; padding-left: 20px; color:#4338CA; font-size:13px; line-height:1.6; display:flex; flex-direction:column; gap:6px;">
                        <li><strong>Document thoroughly:</strong> Every step taken ensures traceability.</li>
                        <li><strong>Identify root cause:</strong> Treat the disease, not just the symptoms.</li>
                        <li><strong>Suggest preventive measures:</strong> Help the team avoid repeat issues.</li>
                    </ul>
                </div>

                <!-- Resolution Stats -->
                <div class="card" style="padding: 24px;">
                    <h3 style="margin:0 0 16px 0; font-size:14px; font-weight:var(--font-bold); color:#1E293B;">Team Resolution Stats</h3>
                    <div style="display:flex; flex-direction:column; gap:16px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #F1F5F9;">
                            <span style="font-size:13px; color:var(--text-muted);">Resolved this month</span>
                            <span style="font-weight:var(--font-bold); color:#10B981;">24</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #F1F5F9;">
                            <span style="font-size:13px; color:var(--text-muted);">Avg resolution time</span>
                            <span style="font-weight:var(--font-bold); color:#334155;">1.2 days</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:13px; color:var(--text-muted);">Success rate</span>
                            <span style="font-weight:var(--font-bold); color:#334155;">98.5%</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    `;

    document.getElementById('resolve-issue-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = e.submitter;
        btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Saving...';
        btn.disabled = true;

        issueData.status = 'Resolved';
        issueData.resolution = {
            type: document.getElementById('res_type').value,
            time_spent: document.getElementById('res_time').value,
            summary: document.getElementById('res_summary').value,
            actions_taken: document.getElementById('res_actions').value,
            root_cause: document.getElementById('res_root_cause').value,
            preventive_measures: document.getElementById('res_preventive').value,
            followup_required: document.getElementById('res_followup').checked,
            resolved_by: user.emp_id,
            resolved_date: new Date().toISOString()
        };
        
        if (!issueData.updates) issueData.updates = [];
        issueData.updates.push({
            sender: user.emp_id,
            time: new Date().toISOString().split('T')[0],
            message: `Issue resolved: ${issueData.resolution.summary}`
        });

        db.saveData();

        setTimeout(() => {
            window.location.href = 'issue-management.html';
        }, 500);
    });
});

// /js/views/employee/issue-details.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderIssueDetails(container, issueId) {
    const user = auth.getCurrentUser();
    const issue = db.getIssuesForUser(user.emp_id).find(i => i.issue_id === issueId);
    
    if(!issue) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px;">Issue Not Found. <a href="#issues">Return</a></div>`;
        return;
    }

    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; align-items:center; gap: 15px;">
            <a href="#issues" style="color:var(--text-main); text-decoration:none;"><i class="ph ph-arrow-left"></i></a>
            <div style="font-weight:var(--font-bold);">Issue Details</div>
        </div>
    `;

    const getPriorityBadge = (p) => {
        if(p === 'High') return 'badge-high';
        if(p === 'Medium') return 'badge-medium';
        return 'badge-low';
    };

    const getStatusBadge = (s) => {
        if(s === 'In Progress') return 'badge-in-progress';
        if(s === 'Resolved') return 'badge-completed';
        return 'badge-open'; 
    };

    // Calculate generic progress percentage based on Status
    let progressPerc = 25; // Open
    let timelineIndex = 0;
    if(issue.status === 'In Progress') { progressPerc = 60; timelineIndex = 3; }
    if(issue.status === 'Resolved') { progressPerc = 100; timelineIndex = 4; }
    if(issue.assigned_to !== 'Unassigned' && issue.status === 'Open') { progressPerc = 40; timelineIndex = 2; }

    container.innerHTML = `
        <!-- Top Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); margin-bottom: var(--spacing-xl);">
            
            <!-- Card 1: Information -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 16px 0; font-size:var(--text-lg);">Issue Information</h3>
                <div style="display:flex; flex-direction:column; gap: var(--spacing-md); font-size: var(--text-sm);">
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
                        <span style="color:var(--text-muted);">Issue ID</span>
                        <span style="font-weight:bold;">${issue.issue_id}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
                        <span style="color:var(--text-muted);">Category</span>
                        <span class="badge badge-low" style="padding: 2px 8px;">${issue.type}</span>
                    </div>
                    <div>
                        <div style="color:var(--text-muted); margin-bottom:4px;">Title</div>
                        <div style="font-weight:bold;">${issue.title}</div>
                    </div>
                    <div>
                        <div style="color:var(--text-muted); margin-bottom:4px;">Description</div>
                        <div class="form-control" style="background-color: var(--bg-main); border:none;">${issue.description}</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px; padding-top:8px;">
                        <span style="color:var(--text-muted);">Raised Date</span>
                        <span>${issue.raised_date}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--text-muted);">Assigned To</span>
                        <span>${issue.assigned_to}</span>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <div style="color:var(--text-muted); margin-bottom: 8px;">Attachments</div>
                        <div style="display:flex; align-items:center; gap: 10px; border: 1px solid var(--border-color); padding: 8px 12px; border-radius: var(--radius-md); width: max-content;">
                            <i class="ph ph-file-pdf" style="color: var(--danger-color); font-size: 20px;"></i>
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:bold; font-size: 11px;">error_log.pdf</span>
                                <span style="color:var(--text-muted); font-size: 10px;">1.2 MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Overview -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 16px 0; font-size:var(--text-lg);">Status Overview</h3>
                <div style="display:flex; flex-direction:column; gap: var(--spacing-lg); font-size: var(--text-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:var(--text-muted);">Current Status</span>
                        <span class="badge ${getStatusBadge(issue.status)}" style="padding:4px 12px; font-size: 12px;">${issue.status}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:var(--text-muted);">Priority Level</span>
                        <div style="display:flex; align-items:center; gap: 5px;">
                            <i class="ph ph-warning" style="color: var(--danger-color);"></i>
                            <span class="badge ${getPriorityBadge(issue.priority)}" style="padding:2px 8px; font-size:11px;">${issue.priority}</span>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--text-muted);">Last Updated</span>
                        <span>${issue.updates.length > 0 ? issue.updates[issue.updates.length-1].time : issue.raised_date}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--text-muted);">Expected Resolution</span>
                        <span>TBD</span>
                    </div>

                    <!-- Progress Bar -->
                    <div style="margin-top: 24px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                            <span style="font-weight:bold;">Progress</span>
                            <span style="color: var(--primary-color); font-weight:bold;">${progressPerc}% Complete</span>
                        </div>
                        <div style="width: 100%; background-color: var(--border-color); border-radius: 4px; overflow: hidden; height: 10px;">
                            <div style="width: ${progressPerc}%; background-color: var(--primary-color); height: 100%;"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Bottom Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl);">
            
            <!-- Card 3: Timeline -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 24px 0; font-size:var(--text-lg);">Progress Timeline</h3>
                <div id="timeline">
                    ${['Issue Submitted', 'Under Review', 'Assigned to Lead', 'In Progress', 'Resolved'].map((step, idx) => `
                        <div class="timeline-item">
                            <div class="timeline-icon ${idx <= timelineIndex ? 'completed' : ''}">
                                ${idx <= timelineIndex ? '<i class="ph-bold ph-check"></i>' : ''}
                            </div>
                            <div style="font-weight: ${idx <= timelineIndex ? 'bold' : 'normal'}; color: ${idx <= timelineIndex ? 'var(--text-main)' : 'var(--text-muted)'}; margin-top:2px;">
                                ${step}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Card 4: Updates Thread -->
            <div class="card" style="padding: 24px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <h3 style="margin:0 0 16px 0; font-size:var(--text-lg);">Issue Updates</h3>
                    
                    <div style="display:flex; flex-direction:column; gap: 16px; margin-bottom: 24px; max-height: 200px; overflow-y:auto; padding-right:10px;">
                        ${issue.updates.length === 0 ? '<div style="color:var(--text-muted); text-align:center;">No updates yet.</div>' : ''}
                        ${issue.updates.map(u => `
                            <div style="display:flex; flex-direction:column; gap: 4px;">
                                <div style="display:flex; justify-content:space-between; font-size: 11px;">
                                    <span style="font-weight:bold;">${u.sender}</span>
                                    <span style="color:var(--text-muted);">${u.time}</span>
                                </div>
                                <div style="background-color: var(--primary-light); color: var(--text-main); padding: 10px; border-radius: 8px; border-top-left-radius: 0; font-size: var(--text-sm);">
                                    ${u.message}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display:flex; gap: 8px;">
                    <input type="text" class="form-control" placeholder="Write update or comment..." style="border-radius:var(--radius-md); flex:1;">
                    <button class="btn btn-purple" style="border-radius:var(--radius-md); padding: 0 16px;">Add</button>
                </div>
            </div>

        </div>

        <!-- Horizontal Action Bottom Buttons -->
        <div style="display:flex; gap: var(--spacing-md); margin-top: var(--spacing-xl);">
            <button class="btn btn-purple" style="flex:1; padding: 16px; font-size: var(--text-md); font-weight:bold;">Update Comment</button>
            <button class="btn btn-purple" style="flex:1; padding: 16px; font-size: var(--text-md); font-weight:bold; background-color: var(--text-main);">Close Issue</button>
        </div>
    `;
}

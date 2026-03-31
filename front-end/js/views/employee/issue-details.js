// /js/views/employee/issue-details.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const params = new URLSearchParams(window.location.search);
    const issueId = params.get('id');

    const issue = db.getIssuesForUser(user.emp_id).find(i => i.issue_id === issueId);
    
    if(!issue) {
        document.getElementById('issue-error').style.display = 'block';
        return;
    }

    document.getElementById('issue-content').style.display = 'block';

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

    let progressPerc = 25; // Open
    let timelineIndex = 0;
    if(issue.status === 'In Progress') { progressPerc = 60; timelineIndex = 3; }
    if(issue.status === 'Resolved') { progressPerc = 100; timelineIndex = 4; }
    if(issue.assigned_to !== 'Unassigned' && issue.status === 'Open') { progressPerc = 40; timelineIndex = 2; }

    // Populate standard textual info
    document.getElementById('id-id').textContent = issue.issue_id;
    document.getElementById('id-type').textContent = issue.type;
    document.getElementById('id-title').textContent = issue.title;
    document.getElementById('id-desc').textContent = issue.description;
    
    document.getElementById('id-raised').textContent = issue.raised_date;
    document.getElementById('id-assigned').textContent = issue.assigned_to;
    document.getElementById('id-last-updated').textContent = issue.updates.length > 0 ? issue.updates[issue.updates.length-1].time : issue.raised_date;

    // Badges
    const statBadge = document.getElementById('id-status-badge');
    statBadge.textContent = issue.status;
    statBadge.className = `badge ${getStatusBadge(issue.status)}`;

    const priBadge = document.getElementById('id-priority-badge');
    priBadge.textContent = issue.priority;
    priBadge.className = `badge ${getPriorityBadge(issue.priority)}`;

    document.getElementById('id-progress-text').textContent = `${progressPerc}% Complete`;
    document.getElementById('id-progress-fill').style.width = `${progressPerc}%`;

    // Timeline list
    const timeline = document.getElementById('timeline');
    const steps = ['Issue Submitted', 'Under Review', 'Assigned to Lead', 'In Progress', 'Resolved'];
    timeline.innerHTML = steps.map((step, idx) => `
        <div class="timeline-item">
            <div class="timeline-icon ${idx <= timelineIndex ? 'completed' : ''}">
                ${idx <= timelineIndex ? '<i class="ph-bold ph-check"></i>' : ''}
            </div>
            <div style="font-weight: ${idx <= timelineIndex ? 'bold' : 'normal'}; color: ${idx <= timelineIndex ? 'var(--text-main)' : 'var(--text-muted)'}; margin-top:2px;">
                ${step}
            </div>
        </div>
    `).join('');

    // Updates list
    const updatesList = document.getElementById('updates-list');
    if(issue.updates.length === 0) {
        updatesList.innerHTML = '<div style="color:var(--text-muted); text-align:center;">No updates yet.</div>';
    } else {
        updatesList.innerHTML = issue.updates.map(u => `
            <div style="display:flex; flex-direction:column; gap: 4px;">
                <div style="display:flex; justify-content:space-between; font-size: 11px;">
                    <span style="font-weight:bold;">${u.sender}</span>
                    <span style="color:var(--text-muted);">${u.time}</span>
                </div>
                <div style="background-color: var(--primary-light); color: var(--text-main); padding: 10px; border-radius: 8px; border-top-left-radius: 0; font-size: var(--text-sm);">
                    ${u.message}
                </div>
            </div>
        `).join('');
    }
});

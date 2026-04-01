// /js/views/hr/escalations.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getEscalationsFromDB = () => {
        return db.getAllEscalations().map(e => {
            const reporter = db.getUserById(e.escalated_from);
            const reporterName = reporter ? reporter.emp_name.split(' (')[0] : 'Unknown';
            let empName = reporterName;
            let empId = e.escalated_from;
            
            if(e.related_employee) {
                empName = e.related_employee;
                empId = '-';
            }

            return {
                id: e.escalation_id,
                lead: reporterName,
                title: e.title || e.escalation_reason || 'Escalation Notice',
                type: e.category || 'General',
                priority: e.priority || 'Medium',
                empName: empName,
                empId: empId,
                status: e.status === 'OPEN' ? 'Pending' : e.status,
                date: e.escalation_date,
                comments: []
            };
        }).reverse();
    };

    let dummyEscalations = getEscalationsFromDB();

    const breadCrumbs = document.getElementById('escBreadcrumbs');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewDetails = document.getElementById('view-details');
    const viewAction = document.getElementById('view-action');
    const tbody = document.getElementById('escTbody');

    function hideAll() {
        viewDashboard.classList.remove('active');
        viewDetails.classList.remove('active');
        viewAction.classList.remove('active');
    }

    function renderTable() {
        if (!tbody) return;
        tbody.innerHTML = dummyEscalations.map(e => {
            let pColor = e.priority === 'High' ? 'var(--color-high)' : e.priority === 'Medium' ? 'var(--color-med)' : 'var(--color-low)';
            let pBg = e.priority === 'High' ? 'var(--color-high-bg)' : e.priority === 'Medium' ? 'var(--color-med-bg)' : 'var(--color-low-bg)';
            
            let sColor = e.status === 'Pending' ? 'var(--color-med)' : e.status === 'Resolved' ? 'var(--color-low)' : '#3B82F6';
            let sBg = e.status === 'Pending' ? 'var(--color-med-bg)' : e.status === 'Resolved' ? 'var(--color-low-bg)' : 'rgba(59,130,246,0.1)';

            return `
            <tr data-id="${e.id}" class="row-esc-click">
                <td style="font-weight:600; color:var(--esc-primary);">${e.id}</td>
                <td style="font-weight:500;">${e.title}</td>
                <td>${e.lead}</td>
                <td class="pri-col"><span class="badge" style="background:${pBg}; color:${pColor};">${e.priority}</span></td>
                <td>${e.empName}</td>
                <td class="stat-col"><span class="badge" style="background:${sBg}; color:${sColor};">${e.status}</span></td>
                <td>${e.date}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-outline btn-route-rev" data-id="${e.id}" style="padding:4px 8px; font-size:11px;">Review</button>
                        <button class="btn btn-primary btn-route-act" data-id="${e.id}" style="padding:4px 8px; font-size:11px;">Take Action</button>
                        <button class="btn btn-outline btn-close" style="padding:4px 8px; font-size:11px; color:var(--esc-muted);">Close</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        // Attach listeners to generic rows and buttons
        document.querySelectorAll('.row-esc-click, .btn-route-rev, .btn-disc-action').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (!id) return;
                e.stopPropagation();
                navDetails(id);
            });
        });

        document.querySelectorAll('.btn-route-act').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                e.stopPropagation();
                navAction(id);
            });
        });

        document.querySelectorAll('.btn-close').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                alert('Closed');
            });
        });
    }

    function navDashboard() {
        hideAll();
        breadCrumbs.innerHTML = '';
        viewDashboard.classList.add('active');
        renderTable();
    }

    function navDetails(id) {
        const esc = dummyEscalations.find(e => e.id === id);
        if(!esc) return;

        hideAll();
        
        breadCrumbs.innerHTML = `<span><i class="ph ph-arrow-left"></i> Back to Dashboard</span>`;
        breadCrumbs.querySelector('span').addEventListener('click', navDashboard);

        viewDetails.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:24px; align-items:flex-end;">
                <div>
                    <h2 style="margin:0 0 8px 0;">${esc.id}: ${esc.title}</h2>
                    <div style="display:flex; gap:8px;">
                        <span class="badge" style="background:var(--color-high-bg); color:var(--color-high);">${esc.priority} Priority</span>
                        <span class="badge" style="background:var(--color-med-bg); color:var(--color-med);">${esc.status} HR Action</span>
                        <span style="font-size:12px; color:var(--esc-muted); margin-left:12px;">Raised on ${esc.date}</span>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-proceed-action" data-id="${id}">Proceed to Take Action</button>
            </div>

            <div class="details-grid">
                <!-- Left Column -->
                <div style="display:flex; flex-direction:column; gap:24px;">
                    <div class="card">
                        <h3 style="margin-top:0;">Escalation Details</h3>
                        <p style="color:var(--esc-muted); font-size:14px; line-height:1.6;">
                            This escalation was automatically triggered due to a severe breach of company attendance policy. The employee has accumulated unauthorized absences exceeding the threshold. Standard procedure requires immediate investigation.
                        </p>
                    </div>

                    <div class="card">
                        <h3 style="margin-top:0;">Team Lead Comments</h3>
                        ${esc.comments.length > 0 ? esc.comments.map(c => `
                            <div style="background:var(--bg-main); border-radius:8px; padding:16px; margin-bottom:12px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                    <strong>${c.name}</strong> <span style="font-size:11px; color:var(--esc-muted);">${c.time}</span>
                                </div>
                                <div style="font-size:14px;">${c.text}</div>
                            </div>
                        `).join('') : '<div style="font-size:14px; color:var(--esc-muted);">No comments from lead yet.</div>'}
                    </div>

                    <div class="alert-banner warning-banner" style="background:var(--color-med-bg); border-color:var(--color-med); color:var(--color-med);">
                        <i class="ph-fill ph-siren" style="font-size:24px;"></i>
                        <div>
                            <div style="font-weight:700;">Pattern Alert</div>
                            <div style="font-size:13px; margin-top:4px;">This employee has 2 prior warnings for similar behavior in the last 6 months.</div>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div style="display:flex; flex-direction:column; gap:24px;">
                    <div class="card" style="background: rgba(123,44,191,0.03); border: 1px solid rgba(123,44,191,0.1);">
                        <h3 style="margin-top:0;">Employee Info</h3>
                        <div style="font-weight:600; font-size:18px; margin-bottom:4px;">${esc.empName}</div>
                        <div style="font-size:13px; color:var(--esc-muted); margin-bottom:16px;">${esc.empId} • ${esc.type}</div>
                        <ul style="list-style:none; padding:0; margin:0; font-size:13px; display:flex; flex-direction:column; gap:12px;">
                            <li><strong>Dept:</strong> Engineering</li>
                            <li><strong>Role:</strong> Backend Developer</li>
                            <li><strong>Manager:</strong> ${esc.lead}</li>
                            <li><strong>Join Date:</strong> Jan 15, 2022</li>
                        </ul>
                    </div>
                    
                    <div class="card">
                        <h3 style="margin-top:0;">Work Impact</h3>
                        <p style="font-size:13px; color:var(--color-high); font-weight:500;">Critical project delivery delayed by 2 milestones. Team reallocation required.</p>
                        
                        <h4 style="margin-top:20px; font-size:13px;">Affected Team Members</h4>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <span class="badge" style="background:var(--bg-main); color:var(--esc-text);">Mike Ross</span>
                            <span class="badge" style="background:var(--bg-main); color:var(--esc-text);">Rachel Zane</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-proceed-action').addEventListener('click', (e) => navAction(e.target.dataset.id));
        viewDetails.classList.add('active');
    }

    function navAction(id) {
        const esc = dummyEscalations.find(e => e.id === id);
        if(!esc) return;

        hideAll();
        
        breadCrumbs.innerHTML = `
            <span id="nav-act-home"><i class="ph ph-house"></i> Home</span> 
            <i class="ph ph-caret-right" style="margin:0 8px; color:var(--esc-muted);"></i> 
            <span id="nav-act-det">Details</span>
            <i class="ph ph-caret-right" style="margin:0 8px; color:var(--esc-muted);"></i> 
            <span style="color:var(--esc-text);">Action Center</span>
        `;
        document.getElementById('nav-act-home').addEventListener('click', navDashboard);
        document.getElementById('nav-act-det').addEventListener('click', () => navDetails(id));

        viewAction.innerHTML = `
            <div class="alert-banner" style="background:rgba(239,68,68,0.15);">
                <i class="ph-fill ph-warning" style="font-size:24px;"></i>
                <div>
                    <div style="font-weight:700; font-size:16px;">Action Required - High Priority Escalation</div>
                </div>
            </div>

            <div class="details-grid">
                <div style="display:flex; flex-direction:column; gap:24px;">
                    <div class="card" style="display:flex; gap:12px; flex-wrap: wrap;">
                        <button class="btn btn-primary" id="btn-resolve-act">Resolve & Take Action</button>
                        <button class="btn btn-outline" style="border-color:var(--color-high); color:var(--color-high);"><i class="ph ph-prohibit"></i> Reject Escalation</button>
                        <button class="btn btn-outline"><i class="ph ph-file-pdf"></i> Generate Report</button>
                    </div>

                    <div class="card">
                        <h3 style="margin-top:0;">Policy Violation Card</h3>
                        <div style="padding:16px; border-left:4px solid var(--color-high); background:var(--color-high-bg); font-size:14px; border-radius:4px; margin-bottom:16px;">
                            <strong>Section 4.1: Code of Conduct - Attendance</strong><br><br>
                            Unauthorized absence exceeding 2 consecutive days without manager approval classifies as gross insubordination and dictates a formal written warning and pipeline to termination protocol.
                        </div>
                        <div style="font-weight:600; font-size:14px;">Recommended HR Action:</div>
                        <div style="font-size:14px; margin-top:8px;">Issue Formal Written Warning / Schedule Show Cause hearing.</div>
                    </div>

                    <div class="card">
                        <h3 style="margin-top:0;">HR Notes</h3>
                        <textarea style="width:100%; height:100px; padding:12px; border:1px solid var(--esc-border); border-radius:8px; resize:vertical; outline:none; font-family:inherit; font-size:13px; margin-bottom:12px; background:var(--bg-main); color:var(--text-main);" placeholder="Document your investigation findings and actions taken..."></textarea>
                        <button class="btn btn-outline" onclick="alert('Notes Saved!')">Save Note</button>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:24px;">
                    <div class="card">
                        <h3 style="margin-top:0; font-size:15px;">Escalation Timeline</h3>
                        <div class="timeline">
                            <div class="timeline-item">
                                <div style="font-size:11px; color:var(--esc-muted);">Oct 24, 10:00 AM</div>
                                <div style="font-size:13px; font-weight:500;">Escalation Automatically Raised</div>
                            </div>
                            <div class="timeline-item">
                                <div style="font-size:11px; color:var(--esc-muted);">Oct 24, 10:30 AM</div>
                                <div style="font-size:13px; font-weight:500;">Lead Comment Added</div>
                            </div>
                            <div class="timeline-item">
                                <div style="font-size:11px; color:var(--esc-muted);">Oct 24, 11:15 AM</div>
                                <div style="font-size:13px; font-weight:500;">HR Acknowledged & Under Review</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 style="margin-top:0; font-size:14px;">Resolution Guidelines</h3>
                        <ul style="padding-left:16px; font-size:13px; margin:0; line-height:1.6; color:var(--esc-muted);">
                            <li>Contact Team Lead for verbal confirmation.</li>
                            <li>Ping employee on alternate contacts.</li>
                            <li>Send formal show-cause email.</li>
                            <li>Log actions in HRIS automatically via resolution button.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-resolve-act').addEventListener('click', () => {
            db.updateEscalation(id, {status: 'Resolved'});
            dummyEscalations = getEscalationsFromDB();
            alert('Proceeding with disciplinary action workflows...'); 
            navDashboard();
        });

        viewAction.classList.add('active');
    }

    // Filter Buttons logic
    let emptyRow = null;

    function filterTable(e, filterStr) {
        if(!tbody) return;
        
        if (e) {
            document.querySelectorAll('#btn-filter-all, #btn-filter-crit, #btn-filter-pend').forEach(b => {
                if(b) b.classList.remove('active', 'btn-primary');
                if(b) b.classList.add('btn-outline');
            });
            const t = e.currentTarget;
            t.classList.remove('btn-outline');
            t.classList.add('btn-primary');
        }

        const rows = tbody.querySelectorAll('tr:not(.empty-row)');
        let visibleCount = 0;
        
        rows.forEach(r => {
            let show = false;
            if (filterStr === 'all') {
                show = true;
            } else if (filterStr === 'Critical') {
                const prior = r.querySelector('.pri-col').innerText.trim();
                show = (prior === 'High');
            } else if (filterStr === 'Pending') {
                const stat = r.querySelector('.stat-col').innerText.trim();
                show = (stat === 'Pending');
            }
            r.style.display = show ? '' : 'none';
            if(show) visibleCount++;
        });

        if (visibleCount === 0) {
            if (!emptyRow) {
                emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-row';
                emptyRow.innerHTML = '<td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No escalations found for this filter.</td>';
                tbody.appendChild(emptyRow);
            }
            emptyRow.style.display = '';
        } else if (emptyRow) {
            emptyRow.style.display = 'none';
        }
    }

    const btnAll = document.getElementById('btn-filter-all');
    const btnCrit = document.getElementById('btn-filter-crit');
    const btnPend = document.getElementById('btn-filter-pend');
    if (btnAll) btnAll.addEventListener('click', (e) => filterTable(e, 'all'));
    if (btnCrit) btnCrit.addEventListener('click', (e) => filterTable(e, 'Critical'));
    if (btnPend) btnPend.addEventListener('click', (e) => filterTable(e, 'Pending'));

    // Initialize
    navDashboard();
});

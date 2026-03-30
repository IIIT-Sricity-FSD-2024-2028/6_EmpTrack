// /js/views/hr/escalations.js
export function renderHREscalations(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Escalations</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
            <div id="escBreadcrumbs" style="font-size:13px; font-weight:500; color:var(--emp-primary, #7B2CBF); cursor:pointer;">
                <!-- Breadcrumbs will be injected here -->
            </div>
        </div>
    `;

    // Dummy Data
    const dummyEscalations = [
        { id: 'HR-ESC-001', lead: 'David Clark', title: 'Unauthorized Absence > 3 days', type: 'Attendance', priority: 'High', empName: 'Sarah Johnson', empId: 'EMP-045', status: 'Pending', date: 'Oct 24, 2023', comments: [{name: 'David Clark', text: 'Sarah has not shown up for 3 days without notice.', time: '10:30 AM, Oct 24'}] },
        { id: 'HR-ESC-002', lead: 'Emily Davis', title: 'Policy Violation - Conduct', type: 'Conduct', priority: 'High', empName: 'Mike Ross', empId: 'EMP-012', status: 'Under Review', date: 'Oct 23, 2023', comments: [] },
        { id: 'HR-ESC-003', lead: 'John Smith', title: 'Repeated Late Check-ins', type: 'Attendance', priority: 'Medium', empName: 'Alice Cooper', empId: 'EMP-088', status: 'Pending', date: 'Oct 25, 2023', comments: [] },
        { id: 'HR-ESC-004', lead: 'David Clark', title: 'Delayed Project Delivery', type: 'Performance', priority: 'Low', empName: 'Bob Wilson', empId: 'EMP-022', status: 'Resolved', date: 'Oct 20, 2023', comments: [] }
    ];

    container.innerHTML = `
        <style>
            .hr-esc-root {
                --esc-primary: #7B2CBF;
                --esc-secondary: #9D4EDD;
                --esc-accent: #F72585;
                --esc-bg: #FFFFFF;
                --esc-text: #1F2937;
                --esc-muted: #6B7280;
                --esc-border: #E5E7EB;
                
                --color-high: #EF4444; 
                --color-high-bg: rgba(239,68,68,0.1);
                --color-med: #F97316;
                --color-med-bg: rgba(249,115,22,0.1);
                --color-low: #22C55E;
                --color-low-bg: rgba(34,197,94,0.1);

                font-family: 'Inter', sans-serif;
                animation: hrFadeIn 0.3s ease-out forwards;
            }

            @keyframes hrFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .hr-esc-root .card {
                background: var(--esc-bg);
                border: 1px solid var(--esc-border);
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                padding: 24px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .hr-esc-root .card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

            .hr-esc-root .btn {
                padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s;
            }
            .hr-esc-root .btn-primary { background: var(--esc-primary); color: white; }
            .hr-esc-root .btn-primary:hover { background: #601f99; transform: translateY(-1px); }
            
            .hr-esc-root .btn-danger { background: var(--color-high); color: white; }
            .hr-esc-root .btn-danger:hover { background: #dc2626; transform: translateY(-1px); }

            .hr-esc-root .btn-outline { background: transparent; border: 1px solid var(--esc-border); color: var(--esc-text); }
            .hr-esc-root .btn-outline:hover { background: #f3f4f6; }

            .hr-esc-root .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            
            /* Banner */
            .hr-esc-root .alert-banner { background: var(--color-high-bg); border-left: 4px solid var(--color-high); padding: 16px 20px; border-radius: 8px; display:flex; align-items:center; gap:12px; color: var(--color-high); margin-bottom: 24px; }
            .hr-esc-root .warning-banner { background: var(--color-med-bg); border-left: 4px solid var(--color-med); padding: 16px 20px; border-radius: 8px; color: var(--color-med); margin-bottom: 24px;}

            /* Stats Grid */
            .hr-esc-root .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }
            .hr-esc-root .stat-card { display:flex; align-items:center; gap:16px; padding:20px; }
            .hr-esc-root .stat-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; }
            .hr-esc-root .stat-val { font-size:24px; font-weight:700; color:var(--esc-text); line-height:1; }
            .hr-esc-root .stat-label { font-size:13px; color:var(--esc-muted); font-weight:500; }

            /* Table */
            .hr-esc-root table { width: 100%; border-collapse: collapse; text-align: left; }
            .hr-esc-root th { padding: 16px; font-size: 12px; color: var(--esc-muted); text-transform: uppercase; border-bottom: 1px solid var(--esc-border); }
            .hr-esc-root td { padding: 16px; font-size: 14px; border-bottom: 1px solid var(--esc-border); }
            .hr-esc-root tbody tr:hover { background: #f9fafb; cursor:pointer; }
            
            /* Two Column Details */
            .hr-esc-root .details-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
            @media (max-width: 900px) { .hr-esc-root .details-grid { grid-template-columns: 1fr; } }
            
            .hr-esc-root .timeline { border-left: 2px solid var(--esc-border); padding-left: 16px; margin-left: 8px; display:flex; flex-direction:column; gap:20px;}
            .hr-esc-root .timeline-item { position: relative; }
            .hr-esc-root .timeline-item::before { content:''; position:absolute; left:-25px; top:4px; width:12px; height:12px; border-radius:50%; background:var(--esc-primary); border:2px solid white; }

        </style>

        <div class="hr-esc-root" id="escViewContainer"></div>
    `;

    const viewContainer = document.getElementById('escViewContainer');
    const breadCrumbs = document.getElementById('escBreadcrumbs');

    // Page 1: Dashboard
    function renderDashboard() {
        breadCrumbs.innerHTML = '';
        viewContainer.innerHTML = `
            <div class="alert-banner">
                <i class="ph-fill ph-warning-circle" style="font-size:24px;"></i>
                <div>
                    <div style="font-weight:700; font-size:15px;">Critical Escalations Requiring Immediate Attention</div>
                    <div style="font-size:13px; margin-top:4px;">2 escalations have breached SLA.</div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-icon" style="background:rgba(123,44,191,0.1); color:var(--esc-primary);"><i class="ph-fill ph-stack"></i></div>
                    <div><div class="stat-val">24</div><div class="stat-label">Total Escalations</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background:var(--color-high-bg); color:var(--color-high);"><i class="ph-fill ph-warning"></i></div>
                    <div><div class="stat-val">3</div><div class="stat-label">Critical</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background:rgba(59,130,246,0.1); color:#3B82F6;"><i class="ph-fill ph-magnifying-glass"></i></div>
                    <div><div class="stat-val">8</div><div class="stat-label">Under Review</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background:var(--color-med-bg); color:var(--color-med);"><i class="ph-fill ph-clock-counter-clockwise"></i></div>
                    <div><div class="stat-val">10</div><div class="stat-label">Pending</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background:rgba(247,37,133,0.1); color:var(--esc-accent);"><i class="ph-fill ph-users-three"></i></div>
                    <div><div class="stat-val">5</div><div class="stat-label">Team Leads</div></div>
                </div>
            </div>

            <div class="card" style="padding:0; overflow-x:auto;">
                <div style="padding:20px; border-bottom:1px solid var(--esc-border); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:600; font-size:16px;">Active Escalations Queue</span>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-outline" style="padding:6px 12px; font-size:12px;" onclick="window.escFilterTable('all')">All</button>
                        <button class="btn btn-outline" style="padding:6px 12px; font-size:12px; color:var(--color-high); border-color:var(--color-high);" onclick="window.escFilterTable('Critical')">Filter Critical</button>
                        <button class="btn btn-outline" style="padding:6px 12px; font-size:12px; color:var(--color-med); border-color:var(--color-med);" onclick="window.escFilterTable('Pending')">Filter Pending</button>
                    </div>
                </div>
                <table id="escTable">
                    <thead>
                        <tr>
                            <th>ID</th><th>Issue Title</th><th>Team Lead</th><th>Priority</th><th>Employee</th><th>Status</th><th>Date</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="escTbody">
                        ${dummyEscalations.map(e => {
                            let pColor = e.priority === 'High' ? 'var(--color-high)' : e.priority === 'Medium' ? 'var(--color-med)' : 'var(--color-low)';
                            let pBg = e.priority === 'High' ? 'var(--color-high-bg)' : e.priority === 'Medium' ? 'var(--color-med-bg)' : 'var(--color-low-bg)';
                            
                            let sColor = e.status === 'Pending' ? 'var(--color-med)' : e.status === 'Resolved' ? 'var(--color-low)' : '#3B82F6';
                            let sBg = e.status === 'Pending' ? 'var(--color-med-bg)' : e.status === 'Resolved' ? 'var(--color-low-bg)' : 'rgba(59,130,246,0.1)';

                            return `
                            <tr onclick="window.escNavigateDetails('${e.id}')">
                                <td style="font-weight:600; color:var(--esc-primary);">${e.id}</td>
                                <td style="font-weight:500;">${e.title}</td>
                                <td>${e.lead}</td>
                                <td class="pri-col"><span class="badge" style="background:${pBg}; color:${pColor};">${e.priority}</span></td>
                                <td>${e.empName}</td>
                                <td class="stat-col"><span class="badge" style="background:${sBg}; color:${sColor};">${e.status}</span></td>
                                <td>${e.date}</td>
                                <td>
                                    <div style="display:flex; gap:6px;">
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="event.stopPropagation(); window.escNavigateDetails('${e.id}')">Review</button>
                                        <button class="btn btn-primary" style="padding:4px 8px; font-size:11px;" onclick="event.stopPropagation(); window.escNavigateAction('${e.id}')">Take Action</button>
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; color:var(--esc-muted);" onclick="event.stopPropagation(); alert('Closed')">Close</button>
                                    </div>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-top:24px;">
                <div class="card" style="padding:16px; text-align:center; font-weight:600; font-size:14px; color:var(--esc-primary);">Policy Violation</div>
                <div class="card" style="padding:16px; text-align:center; font-weight:600; font-size:14px; color:var(--esc-secondary);">Team Conflicts</div>
                <div class="card" style="padding:16px; text-align:center; font-weight:600; font-size:14px; color:#3B82F6;">Resource Requests</div>
                <div class="card" style="padding:16px; text-align:center; font-weight:600; font-size:14px; color:var(--color-high);">Serious Complaints</div>
            </div>
            
            <div class="card" style="margin-top:24px;">
                <h3 style="margin-top:0; color:var(--esc-text);">Unauthorized Leave Alerts</h3>
                <div style="color:var(--color-high); font-weight:600; font-size:14px; margin-bottom:16px;">Policy: Unauthorized absence over 2 days mandates automatic disciplinary review.</div>
                <table style="margin-top:16px;">
                    <thead><tr><th>Employee</th><th>Date</th><th>Days</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:500;">Sarah Johnson</td><td>Oct 20 - 23</td><td style="color:var(--color-high); font-weight:700;">3</td><td>No call, no show</td>
                            <td><span class="badge" style="background:var(--color-med-bg); color:var(--color-med);">Pending</span></td>
                            <td style="display:flex; gap:8px;">
                                <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; border-color:var(--color-med); color:var(--color-med);" onclick="alert('Warning Issued')">Issue Warning</button>
                                <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="window.escNavigateDetails('HR-ESC-001')">Disciplinary Action</button>
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight:500;">Mike Ross</td><td>Oct 15 - 16</td><td style="font-weight:700;">2</td><td>Sick (late notice)</td>
                            <td><span class="badge" style="background:var(--color-low-bg); color:var(--color-low);">Resolved</span></td>
                            <td style="display:flex; gap:8px;">
                                <button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="alert('Viewing Details')">View Details</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div style="color:var(--color-high); font-weight:600; font-size:14px; margin-top:20px;">Recommended Action: Issue formal warning for pending alerts.</div>
            </div>
        `;
    }

    // Global Filter Function
    window.escFilterTable = function(filterStr) {
        const tbody = document.getElementById('escTbody');
        if(!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(r => {
            if (filterStr === 'all') {
                r.style.display = '';
            } else if (filterStr === 'Critical') {
                const prior = r.querySelector('.pri-col').innerText.trim();
                r.style.display = (prior === 'High') ? '' : 'none';
            } else if (filterStr === 'Pending') {
                const stat = r.querySelector('.stat-col').innerText.trim();
                r.style.display = (stat === 'Pending') ? '' : 'none';
            }
        });
    };

    // Page 2: Details
    window.escNavigateDetails = function(id) {
        const esc = dummyEscalations.find(e => e.id === id);
        if(!esc) return;

        breadCrumbs.innerHTML = `<span onclick="window.escNavigateDashboard()"><i class="ph ph-arrow-left"></i> Back to Dashboard</span>`;

        viewContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:24px; align-items:flex-end;">
                <div>
                    <h2 style="margin:0 0 8px 0;">${esc.id}: ${esc.title}</h2>
                    <div style="display:flex; gap:8px;">
                        <span class="badge" style="background:var(--color-high-bg); color:var(--color-high);">${esc.priority} Priority</span>
                        <span class="badge" style="background:var(--color-med-bg); color:var(--color-med);">${esc.status} HR Action</span>
                        <span style="font-size:12px; color:var(--esc-muted); margin-left:12px;">Raised on ${esc.date}</span>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="window.escNavigateAction('${id}')">Proceed to Take Action</button>
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
                            <div style="background:#f3f4f6; border-radius:8px; padding:16px; margin-bottom:12px;">
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
                            <span class="badge" style="background:#e5e7eb; color:var(--esc-text);">Mike Ross</span>
                            <span class="badge" style="background:#e5e7eb; color:var(--esc-text);">Rachel Zane</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // Page 3: Action Center
    window.escNavigateAction = function(id) {
        const esc = dummyEscalations.find(e => e.id === id);
        if(!esc) return;

        breadCrumbs.innerHTML = `
            <span onclick="window.escNavigateDashboard()"><i class="ph ph-house"></i> Home</span> 
            <i class="ph ph-caret-right" style="margin:0 8px; color:#ccc;"></i> 
            <span onclick="window.escNavigateDetails('${id}')">Details</span>
             <i class="ph ph-caret-right" style="margin:0 8px; color:#ccc;"></i> 
             <span style="color:var(--esc-text);">Action Center</span>
        `;

        viewContainer.innerHTML = `
            <div class="alert-banner" style="background:rgba(239,68,68,0.15);">
                <i class="ph-fill ph-warning" style="font-size:24px;"></i>
                <div>
                    <div style="font-weight:700; font-size:16px;">Action Required - High Priority Escalation</div>
                </div>
            </div>

            <div class="details-grid">
                <div style="display:flex; flex-direction:column; gap:24px;">
                    <div class="card" style="display:flex; gap:12px;">
                        <button class="btn btn-primary" onclick="alert('Proceeding with disciplinary action workflows...'); window.escNavigateDashboard();">Resolve & Take Action</button>
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
                        <textarea style="width:100%; height:100px; padding:12px; border:1px solid var(--esc-border); border-radius:8px; resize:vertical; outline:none; font-family:inherit; font-size:13px; margin-bottom:12px;" placeholder="Document your investigation findings and actions taken..."></textarea>
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
    };

    window.escNavigateDashboard = renderDashboard;

    // Initial render
    renderDashboard();
}

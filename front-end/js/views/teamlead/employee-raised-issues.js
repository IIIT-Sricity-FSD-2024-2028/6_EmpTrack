// /js/views/teamlead/employee-raised-issues.js

export function renderEmployeeRaisedIssues(container) {
    // Update Page Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.textContent = 'Employee Raised Issues';
    }

    const mockStats = {
        total: 18,
        highPriority: 5,
        pending: 7,
        inProgress: 11
    };

    const mockIssues = [
        { emp: 'James Brown', id: 'ISS-102', title: 'Need access to AWS Console', type: 'Access Request', priority: 'High', status: 'Pending', date: '2026-03-30', priorityColor: 'var(--danger-color)', statusColor: 'var(--warning-color)' },
        { emp: 'Lisa Anderson', id: 'ISS-105', title: 'Laptop overheating', type: 'Hardware', priority: 'Medium', status: 'In Progress', date: '2026-03-29', priorityColor: 'var(--warning-color)', statusColor: '#3b82f6' },
        { emp: 'Sarah Johnson', id: 'ISS-108', title: 'Clarification on new leave policy', type: 'HR Query', priority: 'Low', status: 'Resolved', date: '2026-03-25', priorityColor: 'var(--secondary-color)', statusColor: 'var(--secondary-color)' },
        { emp: 'Mike Davis', id: 'ISS-111', title: 'Conflict with teammate regarding API', type: 'Interpersonal', priority: 'High', status: 'Pending', date: '2026-03-31', priorityColor: 'var(--danger-color)', statusColor: 'var(--warning-color)' },
        { emp: 'Emma Wilson', id: 'ISS-114', title: 'Extend deadline for UI task', type: 'Task Update', priority: 'Low', status: 'In Progress', date: '2026-03-28', priorityColor: 'var(--secondary-color)', statusColor: '#3b82f6' }
    ];

    const renderTable = () => {
        return mockIssues.map(issue => `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);">
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                        ${issue.emp.charAt(0)}
                    </div>
                    <span style="font-weight: var(--font-medium);">${issue.emp}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted);">${issue.id}</td>
                <td style="padding: var(--spacing-md); font-weight: var(--font-medium);">${issue.title}</td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px; background-color: var(--border-light); color: var(--text-main); font-weight: var(--font-medium);">${issue.type}</span>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; background-color: ${issue.priorityColor}20; color: ${issue.priorityColor}; font-weight: var(--font-bold);">${issue.priority}</span>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; background-color: ${issue.statusColor}20; color: ${issue.statusColor}; font-weight: var(--font-bold);">${issue.status}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${issue.date}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; gap: var(--spacing-sm);">
                        <button class="action-btn resolve-btn" title="Resolve Issue" style="padding: 6px 12px; border: none; background-color: rgba(16, 185, 129, 0.1); color: var(--secondary-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-check-circle"></i>
                        </button>
                        <button class="action-btn details-btn" title="View Details" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-eye"></i>
                        </button>
                        <button class="action-btn escalate-hr-btn" title="Escalate to HR" style="padding: 6px 12px; border: none; background-color: rgba(249, 115, 22, 0.1); color: var(--accent-orange); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                            <i class="ph ph-siren"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--spacing-lg); max-width: 1440px; margin: 0 auto; animation: fade-in 0.3s ease-out;">
            
            <!-- Header Section with Back Arrow and Tabs -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--spacing-md);">
                
                <div style="display:flex; align-items:center; gap: var(--spacing-md);">
                    <!-- Back Arrow -->
                    <button id="back-btn" style="background:none; border:none; border-radius: 50%; width: 40px; height: 40px; display:flex; align-items:center; justify-content:center; cursor:pointer; background-color: var(--bg-surface); box-shadow: var(--shadow-sm); transition: transform 0.2s ease;">
                        <i class="ph ph-arrow-left" style="font-size: 1.25rem; color: var(--text-main);"></i>
                    </button>
                    
                    <!-- Tabs -->
                    <div style="display:flex; gap:var(--spacing-md); border-bottom: 2px solid var(--border-light); padding-bottom: 2px;">
                        <button id="nav-low-productivity" class="tab-btn" style="background:none; border:none; padding: 10px 16px; font-family: var(--font-family); font-weight: var(--font-medium); font-size: var(--text-base); color: var(--text-muted); cursor: pointer; transition: color 0.2s ease;">
                            <i class="ph ph-trend-down" style="margin-right:8px;"></i>Low Productivity Alerts
                        </button>
                        <button class="tab-btn active" style="background:none; border:none; padding: 10px 16px; font-family: var(--font-family); font-weight: var(--font-semibold); font-size: var(--text-base); color: var(--text-main); border-bottom: 3px solid #6A11CB; cursor: pointer;">
                            <i class="ph ph-users-three" style="margin-right:8px;"></i>Employee Raised Issues
                        </button>
                    </div>
                </div>

                <!-- Escalate Global Button -->
                <button id="global-escalate-btn" style="background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; border: none; padding: 10px 20px; border-radius: var(--radius-md); font-family: var(--font-family); font-weight: var(--font-semibold); display:flex; align-items:center; gap: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                    <i class="ph ph-siren" style="font-size: 1.2rem;"></i> Escalate to HR
                </button>
            </div>

            <!-- Issues Description Info Card -->
            <div style="background-color: var(--bg-surface); border-left: 4px solid #3b82f6; border-radius: var(--radius-md); padding: var(--spacing-md) var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md);">
                <i class="ph-fill ph-info" style="color: #3b82f6; font-size: 1.5rem;"></i>
                <div>
                    <h4 style="margin:0; font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--text-main);">Information</h4>
                    <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted);">This views shows all the issues raised by your team members requiring your attention. Resolve them locally or escalate to HR if needed.</p>
                </div>
            </div>

            <!-- Stats Row -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-files"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Total Issues</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.total}</h3>
                    </div>
                </div>

                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); color: var(--danger-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-fire"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">High Priority</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.highPriority}</h3>
                    </div>
                </div>

                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-hourglass-high"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Pending</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.pending}</h3>
                    </div>
                </div>

                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-clock"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">In Progress</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.inProgress}</h3>
                    </div>
                </div>
            </div>

            <!-- Table Card -->
            <div style="background-color: var(--bg-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow:hidden;">
                <div style="padding: var(--spacing-lg) var(--spacing-xl); border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); margin:0;">Issues List</h3>
                    <div style="display:flex; gap: var(--spacing-md);">
                        <select style="padding:8px 12px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); outline:none;">
                            <option value="">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <div style="position:relative;">
                            <i class="ph ph-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                            <input type="text" placeholder="Search issues..." style="padding:8px 12px 8px 36px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); outline:none;">
                        </div>
                    </div>
                </div>
                
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead style="background-color: var(--bg-main);">
                            <tr>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Employee</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Issue ID</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Issue Title</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Type</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Priority</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Status</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Raised Date</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTable()}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        
        <style>
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .action-btn:hover { transform: scale(1.1); }
            .tab-btn:hover { color: #6A11CB !important; }
            #global-escalate-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(106, 17, 203, 0.4); }
            #back-btn:hover { transform: scale(1.05); }
        </style>
    `;

    // Navigation Events
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#escalations';
        });
    }

    const navLowProd = document.getElementById('nav-low-productivity');
    if (navLowProd) {
        navLowProd.addEventListener('click', () => {
            window.location.hash = '#escalations';
        });
    }

    const globalEscalateBtn = document.getElementById('global-escalate-btn');
    if (globalEscalateBtn) {
        globalEscalateBtn.addEventListener('click', () => {
            window.location.hash = '#escalate-to-hr';
        });
    }

    // Wiring up individual escalate buttons in the table
    const escalateBtns = container.querySelectorAll('.escalate-hr-btn');
    escalateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = '#escalate-to-hr';
        });
    });
}

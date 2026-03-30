// /js/views/teamlead/escalations.js

export function renderTeamLeadEscalations(container) {
    // Update Page Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.textContent = 'Escalation Management';
    }

    const mockStats = {
        total: 12,
        avgDelay: '2.5 Days',
        employees: 8,
        avgProgress: '42%'
    };

    const mockTasks = [
        { emp: 'John Smith', id: 'T-045', title: 'Payment Gateway Integration', progress: 40, est: '40h', spent: '45h', reason: 'Delayed API access' },
        { emp: 'Mike Davis', id: 'T-052', title: 'Database Migration', progress: 35, est: '24h', spent: '30h', reason: 'Unexpected schema errors' },
        { emp: 'Emma Wilson', id: 'T-061', title: 'User Onboarding Flow', progress: 48, est: '32h', spent: '35h', reason: 'Design revisions pending' },
        { emp: 'Sarah Johnson', id: 'T-068', title: 'Email Templates Update', progress: 20, est: '16h', spent: '18h', reason: 'Content missing' }
    ];

    const renderTable = () => {
        return mockTasks.map(task => `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);">
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                        ${task.emp.charAt(0)}
                    </div>
                    <span style="font-weight: var(--font-medium);">${task.emp}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted);">${task.id}</td>
                <td style="padding: var(--spacing-md);">${task.title}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; align-items:center; gap:var(--spacing-sm);">
                        <div style="flex:1; height: 8px; background-color: var(--border-light); border-radius: var(--radius-full); overflow:hidden;">
                            <div style="width: ${task.progress}%; height: 100%; background-color: var(--danger-color); border-radius: var(--radius-full);"></div>
                        </div>
                        <span style="font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--danger-color);">${task.progress}%</span>
                    </div>
                </td>
                <td style="padding: var(--spacing-md);">${task.spent} / ${task.est}</td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${task.reason}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; gap: var(--spacing-sm);">
                        <button class="action-btn warning-btn" title="Send Warning" style="padding: 6px 12px; border: none; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-warning"></i>
                        </button>
                        <button class="action-btn extend-btn" title="Extend Deadline" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-calendar-plus"></i>
                        </button>
                        <button class="action-btn reassign-btn" title="Reassign Task" style="padding: 6px 12px; border: none; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-users-three"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--spacing-lg); max-width: 1440px; margin: 0 auto; animation: fade-in 0.3s ease-out;">
            
            <!-- Global Action Button & Tabs Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--spacing-md);">
                
                <!-- Tabs -->
                <div style="display:flex; gap:var(--spacing-md); border-bottom: 2px solid var(--border-light); padding-bottom: 2px;">
                    <button class="tab-btn active" style="background:none; border:none; padding: 10px 16px; font-family: var(--font-family); font-weight: var(--font-semibold); font-size: var(--text-base); color: var(--text-main); border-bottom: 3px solid #6A11CB; cursor: pointer;">
                        <i class="ph ph-trend-down" style="margin-right:8px;"></i>Low Productivity Alerts
                    </button>
                    <button id="nav-employee-issues" class="tab-btn" style="background:none; border:none; padding: 10px 16px; font-family: var(--font-family); font-weight: var(--font-medium); font-size: var(--text-base); color: var(--text-muted); cursor: pointer; transition: color 0.2s ease;">
                        <i class="ph ph-users-three" style="margin-right:8px;"></i>Employee Raised Issues
                    </button>
                </div>

                <!-- Escalate Global Button -->
                <button id="global-escalate-btn" style="background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; border: none; padding: 10px 20px; border-radius: var(--radius-md); font-family: var(--font-family); font-weight: var(--font-semibold); display:flex; align-items:center; gap: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                    <i class="ph ph-siren" style="font-size: 1.2rem;"></i> Escalate to HR
                </button>
            </div>

            <!-- Escalation Criteria Highlight -->
            <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: var(--spacing-md) var(--spacing-lg); display:flex; align-items:center; gap: var(--spacing-md);">
                <i class="ph-fill ph-warning-circle" style="color: var(--danger-color); font-size: 1.5rem;"></i>
                <div>
                    <h4 style="margin:0; font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--danger-color);">Escalation Auto-Criteria Triggered</h4>
                    <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: var(--text-main);">Tasks are escalated when progress &lt; 50%. Formula: <b>Progress % = (Hours Spent / Estimated Hours) × 100</b></p>
                </div>
            </div>

            <!-- Stats Row -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); color: var(--danger-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-warning"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Total Escalations</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.total}</h3>
                    </div>
                </div>

                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-clock-counter-clockwise"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Avg Delay</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.avgDelay}</h3>
                    </div>
                </div>

                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-users"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Employees</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.employees}</h3>
                    </div>
                </div>

                <div style="background-color: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.1); color: var(--secondary-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-chart-line-up"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Avg Progress</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.avgProgress}</h3>
                    </div>
                </div>
            </div>

            <!-- Table Card -->
            <div style="background-color: var(--bg-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow:hidden;">
                <div style="padding: var(--spacing-lg) var(--spacing-xl); border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); margin:0;">Escalated Tasks</h3>
                    <div style="position:relative;">
                        <i class="ph ph-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                        <input type="text" placeholder="Search tasks..." style="padding:8px 12px 8px 36px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); outline:none;">
                    </div>
                </div>
                
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead style="background-color: var(--bg-main);">
                            <tr>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Employee Name</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Task ID</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Task Title</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); width: 20%;">Progress %</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Hours (Spent/Est)</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Issue Reason</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTable()}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Bottom Quick Actions -->
            <div style="margin-top: var(--spacing-md);">
                <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); margin:0 0 var(--spacing-md) 0;">Quick Actions Configuration</h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-lg);">
                    
                    <div style="background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display:flex; flex-direction:column; gap: var(--spacing-sm);">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                            <i class="ph-fill ph-warning"></i>
                        </div>
                        <h4 style="margin: 8px 0 0 0; font-size: var(--text-base); font-weight: var(--font-semibold);">Send Warning</h4>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted);">Automatically draft a warning email to underperforming employees.</p>
                    </div>

                    <div style="background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display:flex; flex-direction:column; gap: var(--spacing-sm);">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                            <i class="ph-fill ph-calendar-plus"></i>
                        </div>
                        <h4 style="margin: 8px 0 0 0; font-size: var(--text-base); font-weight: var(--font-semibold);">Extend Deadline</h4>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted);">Adjust project timelines with attached reason codes.</p>
                    </div>

                    <div style="background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display:flex; flex-direction:column; gap: var(--spacing-sm);">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                            <i class="ph-fill ph-users-three"></i>
                        </div>
                        <h4 style="margin: 8px 0 0 0; font-size: var(--text-base); font-weight: var(--font-semibold);">Reassign Task</h4>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted);">Shift workload to available team members efficiently.</p>
                    </div>

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
        </style>
    `;

    // Event Listeners for Navigation logic
    const navEmployeeIssues = document.getElementById('nav-employee-issues');
    if (navEmployeeIssues) {
        navEmployeeIssues.addEventListener('click', () => {
            window.location.hash = '#employee-raised-issues';
        });
    }

    const globalEscalateBtn = document.getElementById('global-escalate-btn');
    if (globalEscalateBtn) {
        globalEscalateBtn.addEventListener('click', () => {
            window.location.hash = '#escalate-to-hr';
        });
    }
}

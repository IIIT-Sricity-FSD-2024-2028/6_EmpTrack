// /js/views/teamlead/reports.js

export function renderTeamLeadReports(container) {
    // Update Page Title natively
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.textContent = 'Reports';
    }

    const mockStats = {
        totalTasks: 248,
        tasksCompleted: 187,
        productivity: '86%',
        avgTime: '18h'
    };

    const recentReports = [
        { id: 'RPT-001', title: 'Weekly Team Progress Report', type: 'Weekly', date: '2026-03-07', size: '2.4 MB' },
        { id: 'RPT-002', title: 'Monthly Performance Summary', type: 'Monthly', date: '2026-03-01', size: '5.1 MB' },
        { id: 'RPT-003', title: 'Leave Adjustments Report', type: 'Custom', date: '2026-02-28', size: '1.2 MB' },
        { id: 'RPT-004', title: 'Weekly Team Progress Report', type: 'Weekly', date: '2026-02-28', size: '2.3 MB' }
    ];

    const getBadgeStyle = (type) => {
        if (type === 'Weekly') return 'background-color: rgba(167, 139, 250, 0.15); color: #8B5CF6;'; // Light purple
        if (type === 'Monthly') return 'background-color: rgba(109, 40, 217, 0.15); color: #6D28D9;'; // Darker purple
        return 'background-color: rgba(107, 114, 128, 0.1); color: #4B5563;'; // Grey for Custom
    };

    const renderTable = () => {
        return recentReports.map(rpt => `
            <tr style="border-bottom: 1px solid var(--border-light); transition: background-color var(--transition-fast);" class="hover-row">
                <td style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm);">
                    ${rpt.id}
                </td>
                <td style="padding: var(--spacing-md); font-weight: var(--font-medium); color: var(--text-main);">
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <i class="ph-fill ph-file-text" style="color: #6A11CB; font-size: 1.1rem;"></i>
                        ${rpt.title}
                    </div>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: var(--font-bold); ${getBadgeStyle(rpt.type)}">${rpt.type}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">
                    ${rpt.date}
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">
                    ${rpt.size}
                </td>
                <td style="padding: var(--spacing-md);">
                    <button class="download-btn hover-btn" title="Download ${rpt.title}" style="padding: 6px 14px; border: none; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; border-radius: var(--radius-md); cursor: pointer; display:flex; align-items:center; gap: 6px; font-family: var(--font-family); font-weight: var(--font-semibold); font-size: var(--text-xs); transition:all 0.2s ease;">
                        <i class="ph ph-download-simple" style="font-size:1.1rem;"></i> Download
                    </button>
                </td>
            </tr>
        `).join('');
    };

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--spacing-xl); max-width: 1440px; margin: 0 auto; animation: fade-in 0.4s ease-out;">
            
            <!-- SECTION 1: Top Summary Cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing-lg);">
                
                <div class="stat-card hover-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-lg); box-shadow: 0 4px 15px rgba(0,0,0,0.03); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap: 8px; border: 1px solid var(--border-light); transition: all 0.3s ease;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background-color: rgba(106, 17, 203, 0.05); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                        <i class="ph-fill ph-list-numbers"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.totalTasks}</h3>
                        <p style="margin:4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Total Tasks Assigned</p>
                    </div>
                </div>

                <div class="stat-card hover-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-lg); box-shadow: 0 4px 15px rgba(0,0,0,0.03); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap: 8px; border: 1px solid var(--border-light); transition: all 0.3s ease;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background-color: rgba(106, 17, 203, 0.05); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                        <i class="ph-fill ph-check-circle"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.tasksCompleted}</h3>
                        <p style="margin:4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Tasks Completed</p>
                    </div>
                </div>

                <div class="stat-card hover-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-lg); box-shadow: 0 4px 15px rgba(0,0,0,0.03); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap: 8px; border: 1px solid var(--border-light); transition: all 0.3s ease;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background-color: rgba(106, 17, 203, 0.05); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                        <i class="ph-fill ph-target"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.productivity}</h3>
                        <p style="margin:4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Team Productivity</p>
                    </div>
                </div>

                <div class="stat-card hover-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-lg); box-shadow: 0 4px 15px rgba(0,0,0,0.03); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap: 8px; border: 1px solid var(--border-light); transition: all 0.3s ease;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background-color: rgba(106, 17, 203, 0.05); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                        <i class="ph-fill ph-clock"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.avgTime}</h3>
                        <p style="margin:4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Avg. Task Time</p>
                    </div>
                </div>

            </div>

            <div style="display:flex; flex-wrap:wrap; gap: var(--spacing-xl);">
                
                <!-- SECTION 2: Generate Custom Report (Left Form) -->
                <div style="flex: 1 1 35%; min-width: 320px;">
                    <div style="background-color: white; border-radius: var(--radius-xl); box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: var(--spacing-xl); border: 1px solid var(--border-light); display:flex; flex-direction:column; gap: var(--spacing-lg); position:relative; overflow:hidden;">
                        <!-- Subtle graphic overlay -->
                        <div style="position:absolute; top:-40px; right:-40px; width:150px; height:150px; border-radius:50%; background: linear-gradient(135deg, rgba(106, 17, 203, 0.05) 0%, rgba(255, 75, 145, 0.05) 100%); pointer-events:none;"></div>
                        
                        <div style="display:flex; align-items:center; gap: 10px; position:relative; z-index:1;">
                            <div style="background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color:white; width: 32px; height: 32px; border-radius: 8px; display:flex; align-items:center; justify-content:center;">
                                <i class="ph-fill ph-magic-wand"></i>
                            </div>
                            <h3 style="margin:0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Generate Custom Report</h3>
                        </div>

                        <div style="display:flex; flex-direction:column; gap: var(--spacing-md); position:relative; z-index:1;">
                            
                            <!-- Dropdown 1 -->
                            <div style="display:flex; flex-direction:column; gap: 6px;">
                                <label style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-main);">Report Type</label>
                                <div style="position:relative;">
                                    <select class="custom-select" style="width:100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: var(--font-family); font-size: var(--text-sm); outline:none; appearance:none; color: var(--text-main); background-color: white; cursor:pointer;" id="report-type">
                                        <option value="Team Performance" selected>Team Performance</option>
                                        <option value="Attendance Log">Attendance Log</option>
                                        <option value="Issue Resolution">Issue Resolution Time</option>
                                    </select>
                                    <i class="ph ph-caret-down" style="position:absolute; right:16px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none;"></i>
                                </div>
                            </div>

                            <!-- Dropdown 2 -->
                            <div style="display:flex; flex-direction:column; gap: 6px;">
                                <label style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-main);">Date Range</label>
                                <div style="position:relative;">
                                    <select class="custom-select" style="width:100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: var(--font-family); font-size: var(--text-sm); outline:none; appearance:none; color: var(--text-main); background-color: white; cursor:pointer;" id="report-date">
                                        <option value="last7" selected>Last 7 days</option>
                                        <option value="last30">Last 30 days</option>
                                        <option value="thisMonth">This Month</option>
                                        <option value="lastQuarter">Last Quarter</option>
                                    </select>
                                    <i class="ph ph-caret-down" style="position:absolute; right:16px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none;"></i>
                                </div>
                            </div>

                            <!-- Dropdown 3 -->
                            <div style="display:flex; flex-direction:column; gap: 6px;">
                                <label style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-main);">Format</label>
                                <div style="position:relative;">
                                    <select class="custom-select" style="width:100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: var(--font-family); font-size: var(--text-sm); outline:none; appearance:none; color: var(--text-main); background-color: white; cursor:pointer;" id="report-format">
                                        <option value="pdf" selected>PDF Document (.pdf)</option>
                                        <option value="csv">Excel / CSV (.csv)</option>
                                        <option value="json">Raw Data (.json)</option>
                                    </select>
                                    <i class="ph ph-caret-down" style="position:absolute; right:16px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none;"></i>
                                </div>
                            </div>

                            <button id="generate-btn" style="margin-top: 10px; position:relative; overflow:hidden; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; border: none; padding: 14px 20px; border-radius: var(--radius-md); font-family: var(--font-family); font-size: var(--text-base); font-weight: var(--font-semibold); display:flex; align-items:center; justify-content:center; gap: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(106, 17, 203, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;">
                                <span class="btn-text" style="display:flex; align-items:center; gap: 8px;"><i class="ph ph-export" style="font-size: 1.2rem;"></i> Generate Report</span>
                                <i class="ph ph-spinner-gap spinner-icon" style="display:none; animation: spin 1s linear infinite; font-size: 1.2rem;"></i>
                            </button>

                        </div>
                    </div>
                </div>

                <!-- SECTION 3: Recent Reports Table -->
                <div style="flex: 1 1 60%; min-width: 320px;">
                    <div style="background-color: white; border-radius: var(--radius-xl); box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow:hidden; border: 1px solid var(--border-light); height: 100%; display:flex; flex-direction:column;">
                        <div style="padding: var(--spacing-lg) var(--spacing-xl); border-bottom: 1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="margin:0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Recent Reports</h3>
                            <div style="position:relative;">
                                <i class="ph ph-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                                <input type="text" placeholder="Search reports..." style="padding:8px 12px 8px 36px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); outline:none;">
                            </div>
                        </div>
                        
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; text-align:left;">
                                <thead style="background-color: var(--bg-main);">
                                    <tr>
                                        <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Report ID</th>
                                        <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Title</th>
                                        <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Type</th>
                                        <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Date Generated</th>
                                        <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Size</th>
                                        <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="reports-table-body">
                                    ${renderTable()}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>

            </div>
        </div>
        
        <!-- Toast Notification Container -->
        <div id="toast-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; display:flex; flex-direction:column; gap:10px;"></div>

        <style>
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes slide-in-toast { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
            @keyframes slide-out-toast { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }

            .hover-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; border-color: rgba(106, 17, 203, 0.2) !important; }
            .hover-row:hover { background-color: var(--bg-main) !important; }
            .hover-btn:hover { background-color: #6A11CB !important; color: white !important; transform: scale(1.05); }
            
            #generate-btn:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(106, 17, 203, 0.4) !important; }
            #generate-btn:active { transform: scale(0.98); }

            .custom-select:focus { border-color: #6A11CB; box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1); }
        </style>
    `;

    // Interactive Logic mapping

    // 1. Mock Loading State on Generate Button
    const genBtn = document.getElementById('generate-btn');
    if (genBtn) {
        genBtn.addEventListener('click', () => {
            const btnText = genBtn.querySelector('.btn-text');
            const spinner = genBtn.querySelector('.spinner-icon');
            const type = document.getElementById('report-type').value;

            // Trigger Loading state
            btnText.style.display = 'none';
            spinner.style.display = 'block';
            genBtn.style.pointerEvents = 'none'; // prevent double clicks

            // Simulate network request delay (1.5 seconds)
            setTimeout(() => {
                btnText.style.display = 'flex';
                btnText.innerHTML = '<i class="ph ph-check-circle" style="font-size: 1.2rem;"></i> Generated!';
                spinner.style.display = 'none';
                genBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)'; // turn green
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    btnText.innerHTML = '<i class="ph ph-export" style="font-size: 1.2rem;"></i> Generate Report';
                    genBtn.style.background = 'linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%)';
                    genBtn.style.pointerEvents = 'auto';
                }, 2000);

                showToast(`Success`, `Your "${type}" report is ready for download.`, 'success');
            }, 1500);
        });
    }

    // 2. Mock Download Interaction on Table Rows
    const downloadBtns = container.querySelectorAll('.download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const title = row.querySelector('td:nth-child(2)').innerText.trim();
            const format = 'PDF';

            // Simulate creating a dummy Blob file for download effect visually
            try {
                const blob = new Blob(["This is a dummy file representing: " + title], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${title.replace(/\s+/g, '_')}_mock.${format.toLowerCase()}`;
                
                document.body.appendChild(a);
                a.click();
                
                window.URL.revokeObjectURL(url);
                a.remove();
            } catch (err) {
                console.error("Blob download failed, falling back to toast.");
            }

            showToast('Download Started', `Downloading ${title}...`, 'info');
        });
    });

    // Helper: Toast Notification System for micro-interactions
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const iconColor = type === 'success' ? '#10B981' : '#3B82F6';
        const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-info';

        toast.style.cssText = `
            background: white; 
            border-left: 4px solid ${iconColor}; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
            padding: 16px; 
            border-radius: 8px; 
            display:flex; 
            align-items:flex-start; 
            gap: 12px; 
            animation: slide-in-toast 0.3s ease-out forwards;
            min-width: 250px;
        `;

        toast.innerHTML = `
            <i class="ph-fill ${iconClass}" style="color: ${iconColor}; font-size: 1.5rem; flex-shrink:0;"></i>
            <div>
                <h4 style="margin:0; font-size: 14px; font-weight: 600; color: var(--text-main);">${title}</h4>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">${message}</p>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slide-out-toast 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

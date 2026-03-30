// /js/views/teamlead/team-performance.js

export function renderTeamPerformance(container) {
    // Update Page Title natively
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.textContent = 'Team Performance';
    }

    const mockStats = {
        teamSize: 6,
        avgProductivity: '86%',
        avgRating: '4.5/5',
        teamGrowth: '+12%'
    };

    const teamMembers = [
        { name: 'John Smith', tasks: 42, rating: 4.8, productivity: 92, attendance: 98, status: 'Excellent' },
        { name: 'Sarah Johnson', tasks: 38, rating: 4.6, productivity: 88, attendance: 100, status: 'Excellent' },
        { name: 'Mike Davis', tasks: 31, rating: 4.0, productivity: 76, attendance: 95, status: 'Good' },
        { name: 'Emma Wilson', tasks: 45, rating: 4.9, productivity: 95, attendance: 99, status: 'Excellent' },
        { name: 'James Brown', tasks: 18, rating: 3.2, productivity: 45, attendance: 85, status: 'Needs Improvement' },
        { name: 'Lisa Anderson', tasks: 39, rating: 4.7, productivity: 90, attendance: 100, status: 'Excellent' }
    ];

    const getStatusColor = (status) => {
        if (status === 'Excellent') return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }; // Green
        if (status === 'Good') return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }; // Blue
        if (status === 'Needs Improvement') return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }; // Red
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }; // Orange default
    };

    const getProdBarColor = (prod) => {
        if (prod >= 85) return 'var(--secondary-color)'; // Green
        if (prod >= 70) return 'var(--warning-color)'; // Orange
        return 'var(--danger-color)'; // Red
    };

    const renderTable = () => {
        return teamMembers.map(emp => {
            const statC = getStatusColor(emp.status);
            const attColor = emp.attendance >= 95 ? '#10B981' : (emp.attendance >= 90 ? '#F59E0B' : '#EF4444');
            const pColor = getProdBarColor(emp.productivity);

            return `
                <tr style="border-bottom: 1px solid var(--border-light); transition: background-color var(--transition-fast);" class="hover-row">
                    <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                            ${emp.name.charAt(0)}
                        </div>
                        <span style="font-weight: var(--font-medium); color: var(--text-main);">${emp.name}</span>
                    </td>
                    <td style="padding: var(--spacing-md);">
                        <span style="padding: 4px 10px; border-radius: 20px; font-size: 12px; background-color: var(--border-light); color: var(--text-muted); font-weight: var(--font-bold);">${emp.tasks} Tasks</span>
                    </td>
                    <td style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-main);">
                        ${emp.rating}
                    </td>
                    <td style="padding: var(--spacing-md);">
                        <div style="display:flex; align-items:center; gap:var(--spacing-sm);">
                            <div style="flex:1; height: 6px; background-color: var(--border-light); border-radius: var(--radius-full); overflow:hidden;">
                                <div style="width: ${emp.productivity}%; height: 100%; background-color: ${pColor}; border-radius: var(--radius-full);"></div>
                            </div>
                            <span style="font-size: 12px; font-weight: var(--font-bold); color: ${pColor}; width: 30px;">${emp.productivity}%</span>
                        </div>
                    </td>
                    <td style="padding: var(--spacing-md);">
                        <span style="padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px; background-color: ${attColor}15; color: ${attColor}; font-weight: var(--font-bold);">${emp.attendance}%</span>
                    </td>
                    <td style="padding: var(--spacing-md);">
                        <span style="padding: 6px 12px; border-radius: var(--radius-full); font-size: 11px; background-color: ${statC.bg}; color: ${statC.color}; font-weight: var(--font-bold); text-transform:uppercase;">${emp.status}</span>
                    </td>
                </tr>
            `;
        }).join('');
    };

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--spacing-lg); max-width: 1440px; margin: 0 auto; animation: fade-in 0.4s ease-out;">
            
            <!-- SECTION 1: Top Row Stats Cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing-lg);">
                
                <div class="perf-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid var(--border-light);">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-users"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Team Size</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-main);">${mockStats.teamSize}</h3>
                    </div>
                </div>

                <div class="perf-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid var(--border-light);">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(16, 185, 129, 0.1); color: var(--secondary-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-target"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Avg. Productivity</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--secondary-color);">${mockStats.avgProductivity}</h3>
                    </div>
                </div>

                <div class="perf-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid var(--border-light);">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(106, 17, 203, 0.1); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-star"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Avg. Rating</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: #6A11CB;">${mockStats.avgRating}</h3>
                    </div>
                </div>

                <div class="perf-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display:flex; align-items:center; gap: var(--spacing-md); transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid var(--border-light);">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color); display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                        <i class="ph-fill ph-trend-up"></i>
                    </div>
                    <div>
                        <p style="margin:0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Team Growth</p>
                        <h3 style="margin:4px 0 0 0; font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--warning-color);">${mockStats.teamGrowth}</h3>
                    </div>
                </div>

            </div>

            <!-- SECTION 2: Individual Performance Table -->
            <div style="background-color: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow:hidden; border: 1px solid var(--border-light);">
                <div style="padding: var(--spacing-lg) var(--spacing-xl); border-bottom: 1px solid var(--border-light);">
                    <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); margin:0;">Individual Performance</h3>
                </div>
                
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead style="background-color: var(--bg-main);">
                            <tr>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Employee Name</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Tasks Completed</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Avg. Rating</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light); width: 25%;">Productivity</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Attendance</th>
                                <th style="padding: var(--spacing-md); font-weight: var(--font-semibold); color: var(--text-muted); font-size: var(--text-sm); border-bottom: 1px solid var(--border-light);">Performance Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTable()}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 3: Charts Section -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--spacing-lg);">
                
                <div class="perf-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display:flex; flex-direction:column; gap: var(--spacing-md);">
                    <h3 style="font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text-main); margin:0;">Monthly Performance Trend</h3>
                    <div style="position:relative; height: 250px; width: 100%;">
                        <canvas id="monthlyTrendChart"></canvas>
                    </div>
                </div>

                <div class="perf-card" style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display:flex; flex-direction:column; gap: var(--spacing-md);">
                    <h3 style="font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text-main); margin:0;">Weekly Task Completion</h3>
                    <div style="position:relative; height: 250px; width: 100%;">
                        <canvas id="weeklyTaskChart"></canvas>
                    </div>
                </div>

            </div>

            <!-- SECTION 4: Team Distribution Summary -->
            <div style="display:flex; flex-direction:column; gap: var(--spacing-md);">
                <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); margin:0;">Team Distribution Summary</h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg);">
                    
                    <div style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display:flex; align-items:center; gap: var(--spacing-md); border-left: 4px solid #10B981; transition: transform 0.2s ease;" class="hover-card">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.1); color: #10B981; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                            <i class="ph-fill ph-trophy"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Top Performers</h3>
                            <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted);">Count: <b>4</b></p>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #10B981; font-weight:var(--font-medium);">Members exceeding expectations</p>
                        </div>
                    </div>

                    <div style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display:flex; align-items:center; gap: var(--spacing-md); border-left: 4px solid #3B82F6; transition: transform 0.2s ease;" class="hover-card">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.1); color: #3B82F6; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                            <i class="ph-fill ph-check-circle"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Meeting Goals</h3>
                            <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted);">Count: <b>1</b></p>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #3B82F6; font-weight:var(--font-medium);">Members on track</p>
                        </div>
                    </div>

                    <div style="background-color: white; border-radius: var(--radius-xl); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display:flex; align-items:center; gap: var(--spacing-md); border-left: 4px solid #EF4444; transition: transform 0.2s ease;" class="hover-card">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); color: #EF4444; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">
                            <i class="ph-fill ph-warning-circle"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Needs Support</h3>
                            <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: var(--text-muted);">Count: <b>1</b></p>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #EF4444; font-weight:var(--font-medium);">Members requiring guidance</p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
        
        <style>
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .perf-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
            .hover-card:hover { transform: scale(1.02); box-shadow: var(--shadow-md); }
            .hover-row:hover { background-color: var(--bg-main) !important; }
        </style>
    `;

    // Charting Logic (Dynamic injection of Chart.js if missing)
    const initCharts = () => {
        const lineCtx = document.getElementById('monthlyTrendChart');
        const barCtx = document.getElementById('weeklyTaskChart');

        if (!lineCtx || !barCtx) return;

        // Line Chart (Monthly Trend)
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Productivity (%)',
                        data: [75, 78, 80, 85, 82, 86],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.4, // smooth curve
                        fill: true,
                        pointBackgroundColor: '#10B981'
                    },
                    {
                        label: 'Quality Score (%)',
                        data: [82, 85, 84, 88, 87, 89],
                        borderColor: '#6A11CB',
                        backgroundColor: 'rgba(106, 17, 203, 0.1)',
                        borderWidth: 2,
                        tension: 0.4, // smooth curve
                        fill: false,
                        pointBackgroundColor: '#6A11CB'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
                },
                scales: {
                    y: { beginAtZero: false, suggestedMin: 60, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Bar Chart (Weekly Task Completion)
        // Creating local gradient
        const barCanvas = barCtx.getContext('2d');
        const purpleGradient = barCanvas.createLinearGradient(0, 0, 0, 400);
        purpleGradient.addColorStop(0, '#FF4B91');
        purpleGradient.addColorStop(1, '#6A11CB');

        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [120, 145, 135, 160],
                    backgroundColor: purpleGradient,
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    // Load Script cleanly
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            initCharts();
        };
        document.head.appendChild(script);
    } else {
        initCharts();
    }
}

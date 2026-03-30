// /js/views/hr/reports.js

export function renderHRReports(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Reports & Analytics</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
        </div>
    `;

    container.innerHTML = `
        <style>
            .hr-reports-root {
                --rep-primary: #7C3AED;
                --rep-blue: #3B82F6;
                --rep-green: #22C55E;
                --rep-orange: #F97316;
                --rep-red: #EF4444;
                animation: hrFadeIn 0.3s ease-out forwards;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            @keyframes hrFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .hr-reports-root .card {
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                box-shadow: var(--shadow-sm);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                padding: 24px;
            }

            .hr-reports-root .card:hover {
                box-shadow: var(--shadow-md);
            }

            /* Tooltip */
            .hr-reports-root .hr-tooltip {
                position: relative;
                cursor: help;
            }
            .hr-reports-root .hr-tooltip::after {
                content: attr(data-tip);
                position: absolute;
                bottom: 120%;
                left: 50%;
                transform: translateX(-50%);
                background: #111827;
                color: white;
                padding: 4px 8px;
                font-size: 11px;
                border-radius: 4px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: 0.2s;
                z-index: 10;
            }
            .hr-reports-root .hr-tooltip:hover::after { opacity: 1; }

            /* Top KPI Cards */
            .hr-reports-root .kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
            }

            .hr-reports-root .kpi-icon {
                width: 44px; height: 44px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 20px; margin-bottom: 12px;
            }

            .hr-reports-root .kpi-label { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-bottom: 4px; }
            .hr-reports-root .kpi-val { font-size: 28px; font-weight: 700; color: var(--text-main); line-height: 1; margin-bottom: 8px; }
            .hr-reports-root .kpi-trend { font-size: 11px; font-weight: 600; }

            /* Chart Grid */
            .hr-reports-root .chart-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }
            
            .hr-reports-root .chart-item {
                position: relative;
                min-height: 300px;
            }
            .hr-reports-root .chart-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: var(--text-main); }

            .hr-reports-root .chart-wrapper {
                position: relative;
                height: 250px;
                width: 100%;
            }

            .hr-reports-root .skeleton {
                background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-main) 50%, var(--border-color) 75%);
                background-size: 400% 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: 8px;
                position: absolute;
                inset: 0;
                z-index: 5;
            }
            @keyframes skeleton-loading { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

            /* Bottom Summary */
            .hr-reports-root .bottom-summary {
                display: flex;
                gap: 24px;
                padding: 24px;
            }
            .hr-reports-root .bs-item {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 0 16px;
                border-left: 3px solid transparent;
            }
            .hr-reports-root .bs-item:first-child { border-left: none; padding-left: 0; }
            .hr-reports-root .bs-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
            .hr-reports-root .bs-val { font-size: 24px; font-weight: 700; color: var(--text-main); }
            .hr-reports-root .bs-trend { font-size: 12px; font-weight: 600; }

            @media (max-width: 900px) {
                .hr-reports-root .chart-grid { grid-template-columns: 1fr; }
                .hr-reports-root .bottom-summary { flex-direction: column; }
                .hr-reports-root .bs-item { border-left: none; border-bottom: 1px solid var(--border-color); padding: 16px 0; }
                .hr-reports-root .bs-item:first-child { padding-top: 0; }
                .hr-reports-root .bs-item:last-child { border-bottom: none; padding-bottom: 0; }
            }
        </style>

        <div class="hr-reports-root">
            
            <!-- KPI Row -->
            <div class="kpi-grid">
                <div class="card hr-tooltip" data-tip="Total active personnel">
                    <div class="kpi-icon" style="background:rgba(59,130,246,0.1); color:var(--rep-blue);"><i class="ph-fill ph-users"></i></div>
                    <div class="kpi-label">Total Employees</div>
                    <div class="kpi-val num-anim" data-val="156">0</div>
                    <div class="kpi-trend" style="color:var(--rep-green);">+8% from last month</div>
                </div>
                <div class="card hr-tooltip" data-tip="Based on completed evaluations">
                    <div class="kpi-icon" style="background:rgba(34,197,94,0.1); color:var(--rep-green);"><i class="ph-fill ph-chart-line-up"></i></div>
                    <div class="kpi-label">Avg. Productivity</div>
                    <div class="kpi-val"><span class="num-anim" data-val="88">0</span>%</div>
                    <div class="kpi-trend" style="color:var(--rep-green);">+2% from last month</div>
                </div>
                <div class="card hr-tooltip" data-tip="30-day aggregate">
                    <div class="kpi-icon" style="background:rgba(124,58,237,0.1); color:var(--rep-primary);"><i class="ph-fill ph-calendar-check"></i></div>
                    <div class="kpi-label">Attendance Rate</div>
                    <div class="kpi-val"><span class="num-anim" data-val="91">0</span>%</div>
                    <div class="kpi-trend" style="color:var(--rep-red);">-1% from last month</div>
                </div>
                <div class="card hr-tooltip" data-tip="Tasks finished within estimates">
                    <div class="kpi-icon" style="background:rgba(249,115,22,0.1); color:var(--rep-orange);"><i class="ph-fill ph-check-square-offset"></i></div>
                    <div class="kpi-label">Task Completion</div>
                    <div class="kpi-val"><span class="num-anim" data-val="95">0</span>%</div>
                    <div class="kpi-trend" style="color:var(--rep-green);">+5% from last month</div>
                </div>
            </div>

            <!-- Charts Tier 1 -->
            <div class="chart-grid">
                <div class="card chart-item">
                    <div class="chart-title">Employee Productivity Trend</div>
                    <div class="chart-wrapper">
                        <div class="skeleton" id="skel-prod"></div>
                        <canvas id="chartProductivity"></canvas>
                    </div>
                </div>
                <div class="card chart-item">
                    <div class="chart-title">Task Completion Rate</div>
                    <div class="chart-wrapper">
                        <div class="skeleton" id="skel-task"></div>
                        <canvas id="chartTask"></canvas>
                    </div>
                </div>
            </div>

            <!-- Charts Tier 2 -->
            <div class="chart-grid">
                <div class="card chart-item">
                    <div class="chart-title">Current Attendance Statistics</div>
                    <div class="chart-wrapper">
                        <div class="skeleton" id="skel-att"></div>
                        <canvas id="chartAttendance"></canvas>
                    </div>
                </div>
                <div class="card chart-item">
                    <div class="chart-title">Issue Resolution Report</div>
                    <div class="chart-wrapper">
                        <div class="skeleton" id="skel-issue"></div>
                        <canvas id="chartIssues"></canvas>
                    </div>
                </div>
            </div>

            <!-- Chart Tier 3 -->
            <div class="card chart-item">
                <div class="chart-title">Department Performance Scores</div>
                <div class="chart-wrapper" style="height:350px;">
                    <div class="skeleton" id="skel-dept"></div>
                    <canvas id="chartDept"></canvas>
                </div>
            </div>

            <!-- Bottom Summary -->
            <div class="card bottom-summary">
                <div class="bs-item" style="border-left-color: var(--rep-blue);">
                    <div class="bs-label">Total Work Hours</div>
                    <div class="bs-val">12,450 hrs</div>
                    <div class="bs-trend" style="color:var(--rep-green);">+6% vs last month</div>
                </div>
                <div class="bs-item" style="border-left-color: var(--rep-green);">
                    <div class="bs-label">Projects Completed</div>
                    <div class="bs-val">18</div>
                    <div class="bs-trend" style="color:var(--rep-green);">+3 vs last month</div>
                </div>
                <div class="bs-item" style="border-left-color: var(--rep-primary);">
                    <div class="bs-label">Average Task Time</div>
                    <div class="bs-val">26 hrs</div>
                    <div class="bs-trend" style="color:var(--rep-green);">-4 hrs improvement</div>
                </div>
            </div>

        </div>
    `;

    // Animate numbers
    const numAnims = container.querySelectorAll('.num-anim');
    numAnims.forEach(anim => {
        const target = +anim.getAttribute('data-val');
        let current = 0;
        const inc = Math.max(1, Math.ceil(target / 40));
        const timer = setInterval(() => {
            current += inc;
            if (current >= target) {
                anim.innerText = target;
                clearInterval(timer);
            } else {
                anim.innerText = current;
            }
        }, 30);
    });

    // Chart.js Setup
    function initCharts() {
        const rootStyles = getComputedStyle(document.body);
        const textColor = rootStyles.getPropertyValue('--text-muted').trim() || '#6B7280';
        const gridColor = rootStyles.getPropertyValue('--border-color').trim() || '#E5E7EB';

        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', sans-serif";

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor }, ticks: { color: textColor } }
            }
        };

        // A. Productivity line (purple)
        new Chart(document.getElementById('chartProductivity'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Productivity %',
                    data: [82, 85, 84, 88, 87, 91],
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#7C3AED'
                }]
            },
            options: commonOptions
        });
        document.getElementById('skel-prod').style.display = 'none';

        // B. Task Completion bar (orange)
        new Chart(document.getElementById('chartTask'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Task Completion Rate',
                    data: [85, 88, 86, 92, 90, 100],
                    backgroundColor: '#F97316',
                    borderRadius: 4,
                    barThickness: 16
                }]
            },
            options: commonOptions
        });
        document.getElementById('skel-task').style.display = 'none';

        // C. Attendance Pie
        new Chart(document.getElementById('chartAttendance'), {
            type: 'pie',
            data: {
                labels: ['Present', 'Absent', 'On Leave'],
                datasets: [{
                    data: [142, 8, 6],
                    backgroundColor: ['#22C55E', '#EF4444', '#F97316'],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 20 } }
                }
            }
        });
        document.getElementById('skel-att').style.display = 'none';

        // D. Issue Resolution bar
        new Chart(document.getElementById('chartIssues'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    { label: 'Resolved', data: [45, 52, 48, 60, 55, 65], backgroundColor: '#22C55E', borderRadius: 4 },
                    { label: 'Open', data: [12, 10, 15, 8, 11, 5], backgroundColor: '#EF4444', borderRadius: 4 }
                ]
            },
            options: commonOptions
        });
        document.getElementById('skel-issue').style.display = 'none';

        // E. Department Performance
        // Create green-purple gradient manually by array or just use deep purple
        new Chart(document.getElementById('chartDept'), {
            type: 'bar',
            data: {
                labels: ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'HR'],
                datasets: [{
                    label: 'Performance Score',
                    data: [94, 98, 91, 88, 95, 99],
                    backgroundColor: '#7C3AED',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor }, max: 100 },
                    y: { grid: { display: false }, ticks: { color: textColor } }
                }
            }
        });
        document.getElementById('skel-dept').style.display = 'none';
    }

    // Load Chart.js script dynamically
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            // Slight delay mapped to skeleton loaders feeling real
            setTimeout(initCharts, 800);
        };
        document.head.appendChild(script);
    } else {
        setTimeout(initCharts, 800);
    }

}

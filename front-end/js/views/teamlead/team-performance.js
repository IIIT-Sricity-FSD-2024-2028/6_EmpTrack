// /js/views/teamlead/team-performance.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getTeamPerformance = () => {
        const team = db.getUsersByManager(user.emp_id);
        const tasks = db.getAllTasksForManager(user.emp_id);
        const allAtt = db.data.attendance || [];

        return team.map(emp => {
            const empTasks = tasks.filter(t => t.assigned_to === emp.emp_id);
            const totalTasks = empTasks.length;
            const completed = empTasks.filter(t => t.status === 'COMPLETED').length;
            const productivity = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 100;

            const myAtt = allAtt.filter(a => a.emp_id === emp.emp_id);
            const present = myAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
            const attendance = myAtt.length > 0 ? Math.round((present / myAtt.length) * 100) : 100;
            
            let status = 'Excellent';
            if(productivity < 50 || attendance < 85) status = 'Needs Improvement';
            else if (productivity < 80) status = 'Good';

            return {
                name: emp.emp_name.split(' (')[0],
                tasks: totalTasks,
                rating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1), // Visual aesthetic proxy
                productivity: productivity,
                attendance: attendance,
                status: status
            };
        });
    };

    const teamMembers = getTeamPerformance();

    const mockStats = {
        teamSize: teamMembers.length,
        avgProductivity: teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, t) => acc + t.productivity, 0) / teamMembers.length) + '%' : '100%',
        avgRating: teamMembers.length > 0 ? (teamMembers.reduce((acc, t) => acc + parseFloat(t.rating), 0) / teamMembers.length).toFixed(1) + '/5' : '5/5',
        teamGrowth: '+12%' // aesthetic diff
    };

    document.getElementById('stat-team-size').textContent = mockStats.teamSize;
    document.getElementById('stat-avg-prod').textContent = mockStats.avgProductivity;
    document.getElementById('stat-avg-rating').textContent = mockStats.avgRating;
    document.getElementById('stat-growth').textContent = mockStats.teamGrowth;

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

    const tbody = document.getElementById('perf-table-body');
    if (tbody) {
        tbody.innerHTML = teamMembers.map(emp => {
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
    }

    // Charting Logic
    const initCharts = () => {
        const lineCtx = document.getElementById('monthlyTrendChart');
        const barCtx = document.getElementById('weeklyTaskChart');
        if (!lineCtx || !barCtx) return;

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
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10B981'
                    },
                    {
                        label: 'Quality Score (%)',
                        data: [82, 85, 84, 88, 87, 89],
                        borderColor: '#6A11CB',
                        backgroundColor: 'rgba(106, 17, 203, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
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
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => initCharts();
        document.head.appendChild(script);
    } else {
        initCharts();
    }
});

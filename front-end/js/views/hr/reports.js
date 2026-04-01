// /js/views/hr/reports.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    // Animate numbers
    const numAnims = document.querySelectorAll('.num-anim');
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




});

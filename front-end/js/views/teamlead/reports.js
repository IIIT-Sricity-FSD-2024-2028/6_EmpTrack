// /js/views/teamlead/reports.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const tasks = db.getAllTasksForManager(user.emp_id);
    const totalTasks = tasks.length;
    const tasksCompleted = tasks.filter(t => t.status === 'COMPLETED').length;
    const productivity = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 100;
    
    // Average time proxy based on hours_spent vs est_hours
    let avgTime = 'N/A';
    if(tasksCompleted > 0) {
        const totalHours = tasks.filter(t => t.status === 'COMPLETED').reduce((acc, t) => acc + parseFloat(t.hours_spent || 0), 0);
        avgTime = Math.round(totalHours / tasksCompleted) + 'h';
    }

    const mockStats = {
        totalTasks,
        tasksCompleted,
        productivity: productivity + '%',
        avgTime
    };

    const recentReports = [
        { id: 'RPT-001', title: 'Weekly Team Progress Report', type: 'Weekly', date: '2026-03-07', size: '2.4 MB' },
        { id: 'RPT-002', title: 'Monthly Performance Summary', type: 'Monthly', date: '2026-03-01', size: '5.1 MB' },
        { id: 'RPT-003', title: 'Leave Adjustments Report', type: 'Custom', date: '2026-02-28', size: '1.2 MB' },
        { id: 'RPT-004', title: 'Weekly Team Progress Report', type: 'Weekly', date: '2026-02-28', size: '2.3 MB' }
    ];

    document.getElementById('stat-total').textContent = mockStats.totalTasks;
    document.getElementById('stat-completed').textContent = mockStats.tasksCompleted;
    document.getElementById('stat-productivity').textContent = mockStats.productivity;
    document.getElementById('stat-avg').textContent = mockStats.avgTime;

    const getBadgeStyle = (type) => {
        if (type === 'Weekly') return 'background-color: rgba(167, 139, 250, 0.15); color: #8B5CF6;';
        if (type === 'Monthly') return 'background-color: rgba(109, 40, 217, 0.15); color: #6D28D9;';
        return 'background-color: rgba(107, 114, 128, 0.1); color: #4B5563;';
    };

    const tbody = document.getElementById('reports-table-body');
    if (tbody) {
        tbody.innerHTML = recentReports.map(rpt => `
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
    }

    const genBtn = document.getElementById('generate-btn');
    if (genBtn) {
        genBtn.addEventListener('click', () => {
            const btnText = genBtn.querySelector('.btn-text');
            const spinner = genBtn.querySelector('.spinner-icon');
            const type = document.getElementById('report-type').value;

            btnText.style.display = 'none';
            spinner.style.display = 'block';
            genBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                btnText.style.display = 'flex';
                btnText.innerHTML = '<i class="ph ph-check-circle" style="font-size: 1.2rem;"></i> Generated!';
                spinner.style.display = 'none';
                genBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                
                setTimeout(() => {
                    btnText.innerHTML = '<i class="ph ph-export" style="font-size: 1.2rem;"></i> Generate Report';
                    genBtn.style.background = 'linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%)';
                    genBtn.style.pointerEvents = 'auto';
                }, 2000);

                showToast(`Success`, `Your "${type}" report is ready for download.`, 'success');
            }, 1500);
        });
    }

    const downloadBtns = document.querySelectorAll('.download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const title = row.querySelector('td:nth-child(2)').innerText.trim();
            const format = 'PDF';

            try {
                const blob = new Blob(["System generated dynamic summary report for: " + title + "\nTotal Tasks: " + totalTasks + "\nCompleted: " + tasksCompleted], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${title.replace(/\s+/g, '_')}_data_export.${format.toLowerCase()}`;
                
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

        setTimeout(() => {
            toast.style.animation = 'slide-out-toast 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

// /js/views/teamlead/work-monitoring.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getWorkData = () => {
        return db.getAllTasksForManager(user.emp_id).map(t => {
            const emp = db.getUserById(t.assigned_to);
            const empName = emp ? emp.emp_name.split(' (')[0] : 'Unknown';
            return {
                name: empName,
                id: t.task_id,
                title: t.task_title,
                est: (t.est_hours || 40) + 'h',
                worked: (t.hours_spent || Math.round((t.est_hours || 40) * (t.progress_percentage || 0) / 100)) + 'h',
                progress: t.progress_percentage || 0
            };
        });
    };

    const mockData = getWorkData();

    const generateTableRows = () => {
        return mockData.map(row => {
            let colorCls = 'fill-red';
            let textColorCls = 'text-red';
            
            if (row.progress >= 75) {
                colorCls = 'fill-green';
                textColorCls = 'text-green';
            } else if (row.progress >= 50) {
                colorCls = 'fill-orange';
                textColorCls = 'text-orange';
            }

            return `
                <tr class="wm-table-row">
                    <td>
                        <div style="display:flex; align-items:center; gap:var(--spacing-sm);">
                            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 12px;">
                                ${row.name.charAt(0)}
                            </div>
                            <span style="font-weight:var(--font-medium);">${row.name}</span>
                        </div>
                    </td>
                    <td style="color:var(--text-muted);">${row.id}</td>
                    <td>${row.title}</td>
                    <td>${row.est}</td>
                    <td>${row.worked}</td>
                    <td>
                        <div class="wm-progress-wrapper" style="display:flex; align-items:center; gap:var(--spacing-md);">
                            <div class="wm-progress-bar-bg" style="flex:1; height:8px; background-color:var(--border-light); border-radius:var(--radius-full); overflow:hidden;">
                                <div class="wm-progress-bar-fill ${colorCls}" style="width: ${row.progress}%; height:100%; border-radius:var(--radius-full); transition: width 1s ease-in-out;"></div>
                            </div>
                            <span class="${textColorCls}" style="font-weight:var(--font-bold); width:40px; text-align:right;">${row.progress}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const tbody = document.getElementById('work-monitoring-body');
    if (tbody) {
        tbody.innerHTML = generateTableRows();
    }
});
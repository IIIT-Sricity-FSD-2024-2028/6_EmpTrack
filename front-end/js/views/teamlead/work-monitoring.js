// /js/views/teamlead/work-monitoring.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const mockData = [
        { name: 'John Smith', id: 'T-001', title: 'Update User Dashboard UI', est: '40h', worked: '30h', progress: 75 },
        { name: 'Sarah Johnson', id: 'T-012', title: 'API Integration', est: '32h', worked: '28h', progress: 88 },
        { name: 'Mike Davis', id: 'T-019', title: 'Database Schema Design', est: '24h', worked: '14h', progress: 58 },
        { name: 'Emma Wilson', id: 'T-007', title: 'Testing and QA', est: '48h', worked: '48h', progress: 100 },
        { name: 'James Brown', id: 'T-023', title: 'Feature Implementation', est: '56h', worked: '22h', progress: 39 },
        { name: 'Lisa Anderson', id: 'T-015', title: 'Security Audit', est: '40h', worked: '32h', progress: 80 },
        { name: 'John Smith', id: 'T-034', title: 'Code Refactoring', est: '24h', worked: '10h', progress: 42 },
        { name: 'Sarah Johnson', id: 'T-028', title: 'Documentation Update', est: '16h', worked: '16h', progress: 100 },
    ];

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
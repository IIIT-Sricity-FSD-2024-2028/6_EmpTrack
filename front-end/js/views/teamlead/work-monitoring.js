// /js/views/teamlead/work-monitoring.js
import { auth } from '../../auth.js';

export function renderTeamLeadWorkMonitoring(container) {
    // Update Page Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.textContent = 'Work Monitoring';
    }

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

    container.innerHTML = `
        <div class="wm-container" style="display:flex; flex-direction:column; gap:var(--spacing-xl);">
            
            <!-- Filters & Search -->
            <div class="wm-filter-bar" style="background-color:var(--bg-surface); padding:var(--spacing-lg); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--spacing-md);">
                
                <div class="wm-search-group" style="flex:1; min-width:250px; position:relative;">
                    <i class="ph ph-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:var(--text-lg);"></i>
                    <input type="text" placeholder="Search tasks..." style="width:100%; padding:10px 12px 10px 40px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); outline:none; transition:border-color var(--transition-fast);">
                </div>

                <div class="wm-filters-group" style="display:flex; gap:var(--spacing-md); flex-wrap:wrap;">
                    <select class="wm-select" style="padding:10px 16px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); color:var(--text-main); background-color:var(--bg-surface); outline:none; cursor:pointer;">
                        <option value="">All Employees</option>
                        <option value="john">John Smith</option>
                        <option value="sarah">Sarah Johnson</option>
                        <option value="mike">Mike Davis</option>
                        <option value="emma">Emma Wilson</option>
                    </select>

                    <select class="wm-select" style="padding:10px 16px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); color:var(--text-main); background-color:var(--bg-surface); outline:none; cursor:pointer;">
                        <option value="">All Status</option>
                        <option value="progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                    </select>

                    <select class="wm-select" style="padding:10px 16px; border:1px solid var(--border-color); border-radius:var(--radius-md); font-family:var(--font-family); font-size:var(--text-sm); color:var(--text-main); background-color:var(--bg-surface); outline:none; cursor:pointer;">
                        <option value="">All Progress</option>
                        <option value="high">75% - 100%</option>
                        <option value="med">50% - 74%</option>
                        <option value="low">Below 50%</option>
                    </select>

                    <button style="padding:10px 20px; border:1px solid var(--primary-color); background-color:transparent; color:var(--primary-color); border-radius:var(--radius-md); font-family:var(--font-family); font-weight:var(--font-semibold); font-size:var(--text-sm); cursor:pointer; display:flex; align-items:center; gap:8px; transition:all var(--transition-fast);">
                        <i class="ph ph-sliders-horizontal"></i> Filters
                    </button>
                </div>
            </div>

            <!-- Team Work Progress Table Card -->
            <div class="wm-table-card" style="background-color:var(--bg-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); overflow:hidden;">
                
                <div style="padding:var(--spacing-lg) var(--spacing-xl); border-bottom:1px solid var(--border-color);">
                    <h3 style="font-size:var(--text-lg); font-weight:var(--font-bold); color:var(--text-main); margin:0;">Team Work Progress</h3>
                </div>

                <div class="table-responsive" style="overflow-x:auto;">
                    <table class="wm-table" style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead style="background-color:var(--bg-main);">
                            <tr>
                                <th style="padding:var(--spacing-md) var(--spacing-xl); font-weight:var(--font-semibold); color:var(--text-muted); font-size:var(--text-sm); border-bottom:1px solid var(--border-color);">Employee Name</th>
                                <th style="padding:var(--spacing-md) var(--spacing-sm); font-weight:var(--font-semibold); color:var(--text-muted); font-size:var(--text-sm); border-bottom:1px solid var(--border-color);">Task ID</th>
                                <th style="padding:var(--spacing-md) var(--spacing-sm); font-weight:var(--font-semibold); color:var(--text-muted); font-size:var(--text-sm); border-bottom:1px solid var(--border-color);">Task Title</th>
                                <th style="padding:var(--spacing-md) var(--spacing-sm); font-weight:var(--font-semibold); color:var(--text-muted); font-size:var(--text-sm); border-bottom:1px solid var(--border-color);">Est. Hours</th>
                                <th style="padding:var(--spacing-md) var(--spacing-sm); font-weight:var(--font-semibold); color:var(--text-muted); font-size:var(--text-sm); border-bottom:1px solid var(--border-color);">Hours Worked</th>
                                <th style="padding:var(--spacing-md) var(--spacing-xl); font-weight:var(--font-semibold); color:var(--text-muted); font-size:var(--text-sm); border-bottom:1px solid var(--border-color); width: 25%;">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;
}
  
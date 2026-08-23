// /js/views/teamlead/employee-raised-issues.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    // Note: these color fields are concatenated with an alpha suffix below
    // (`${issue.priorityColor}20` / `${issue.statusColor}20`) to build translucent
    // badge backgrounds, so they must stay raw hex literals rather than var() —
    // CSS custom properties can't be suffixed that way.
    let mockIssues = [
        { emp: 'James Brown', id: 'ISS-102', title: 'Need access to AWS Console', type: 'Access Request', priority: 'High', status: 'Pending', date: '2026-03-30', priorityColor: 'var(--danger-color)', statusColor: 'var(--warning-color)' },
        { emp: 'Lisa Anderson', id: 'ISS-105', title: 'Laptop overheating', type: 'Hardware', priority: 'Medium', status: 'In Progress', date: '2026-03-29', priorityColor: 'var(--warning-color)', statusColor: '#3b82f6' },
        { emp: 'Sarah Johnson', id: 'ISS-108', title: 'Clarification on new leave policy', type: 'HR Query', priority: 'Low', status: 'Resolved', date: '2026-03-25', priorityColor: 'var(--secondary-color)', statusColor: 'var(--secondary-color)' },
        { emp: 'Mike Davis', id: 'ISS-111', title: 'Conflict with teammate regarding API', type: 'Interpersonal', priority: 'High', status: 'Pending', date: '2026-03-31', priorityColor: 'var(--danger-color)', statusColor: 'var(--warning-color)' },
        { emp: 'Emma Wilson', id: 'ISS-114', title: 'Extend deadline for UI task', type: 'Task Update', priority: 'Low', status: 'In Progress', date: '2026-03-28', priorityColor: 'var(--secondary-color)', statusColor: '#3b82f6' }
    ];

    const allIssues = await db.getAllIssues().catch(() => []);
    const localIssues = allIssues.filter(i => i.emp_id && i.issue_id && !mockIssues.find(m => m.id === i.issue_id));

    const mappedLocal = await Promise.all(localIssues.map(async iss => {
        const empRef = await db.getUserById(iss.emp_id).catch(() => null);
        const empName = empRef ? empRef.emp_name : iss.emp_id;
        
        let priorityColor = 'var(--secondary-color)';
        if(iss.priority === 'High' || iss.priority === 'Critical') priorityColor = 'var(--danger-color)';
        if(iss.priority === 'Medium') priorityColor = 'var(--warning-color)';
        
        let statusColor = 'var(--warning-color)';
        if(iss.status === 'Resolved') statusColor = 'var(--secondary-color)';
        if(iss.status === 'In Progress') statusColor = '#3b82f6';
        
        return {
            emp: empName,
            id: iss.issue_id,
            title: iss.title,
            type: iss.type || 'General',
            priority: iss.priority || 'Medium',
            status: iss.status || 'Pending',
            date: iss.raised_date || new Date().toISOString().split('T')[0],
            priorityColor,
            statusColor
        };
    }));

    mockIssues = [...mappedLocal, ...mockIssues];

    const mockStats = {
        total: mockIssues.length,
        highPriority: mockIssues.filter(i => i.priority === 'High' || i.priority === 'Critical').length,
        pending: mockIssues.filter(i => i.status === 'Pending').length,
        inProgress: mockIssues.filter(i => i.status === 'In Progress').length
    };

    document.getElementById('stat-total').textContent = mockStats.total;
    document.getElementById('stat-high').textContent = mockStats.highPriority;
    document.getElementById('stat-pending').textContent = mockStats.pending;
    document.getElementById('stat-progress').textContent = mockStats.inProgress;

    const tbody = document.getElementById('raised-issues-body');
    if (tbody) {
        tbody.innerHTML = mockIssues.map(issue => `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color var(--transition-fast);">
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px;">
                        ${issue.emp.charAt(0)}
                    </div>
                    <span style="font-weight: var(--font-medium);">${issue.emp}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted);">${issue.id}</td>
                <td style="padding: var(--spacing-md); font-weight: var(--font-medium);">${issue.title}</td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px; background-color: var(--border-light); color: var(--text-main); font-weight: var(--font-medium);">${issue.type}</span>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; background-color: ${issue.priorityColor}20; color: ${issue.priorityColor}; font-weight: var(--font-bold);">${issue.priority}</span>
                </td>
                <td style="padding: var(--spacing-md);">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; background-color: ${issue.statusColor}20; color: ${issue.statusColor}; font-weight: var(--font-bold);">${issue.status}</span>
                </td>
                <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${issue.date}</td>
                <td style="padding: var(--spacing-md);">
                    <div style="display:flex; gap: var(--spacing-sm);">
                        <button class="action-btn resolve-btn" title="Resolve Issue" style="padding: 6px 12px; border: none; background-color: rgba(16, 185, 129, 0.1); color: var(--secondary-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-check-circle"></i>
                        </button>
                        <button class="action-btn details-btn" title="View Details" style="padding: 6px 12px; border: none; background-color: rgba(59, 130, 246, 0.1); color: var(--primary-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
                            <i class="ph ph-eye"></i>
                        </button>
                        <button class="action-btn escalate-hr-btn" title="Escalate to HR" style="padding: 6px 12px; border: none; background-color: rgba(249, 115, 22, 0.1); color: var(--accent-orange); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                            <i class="ph ph-siren"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Re-bind dynamically injected buttons
        const escalateBtns = document.querySelectorAll('.escalate-hr-btn');
        escalateBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                window.location.href = 'escalate-to-hr.html';
            });
        });
    }

    // Navigation Events
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', async () => {
            window.location.href = 'escalations.html';
        });
    }

    const navLowProd = document.getElementById('nav-low-productivity');
    if (navLowProd) {
        navLowProd.addEventListener('click', async () => {
            window.location.href = 'escalations.html';
        });
    }

    const globalEscalateBtn = document.getElementById('global-escalate-btn');
    if (globalEscalateBtn) {
        globalEscalateBtn.addEventListener('click', async () => {
            window.location.href = 'escalate-to-hr.html';
        });
    }

});


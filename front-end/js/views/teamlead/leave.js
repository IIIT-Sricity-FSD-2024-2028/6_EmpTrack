// /js/views/teamlead/leave.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    let currentFilter = 'Pending'; // 'Pending' or 'Approved'

    const unauthorizedData = [
        { id: 'UA-001', name: 'Mike Davis', days: 1, date: '2026-03-29', escalated: '2026-03-30', reason: 'No-Call No-Show' },
        { id: 'UA-002', name: 'James Brown', days: 2, date: '2026-03-27 to 2026-03-28', escalated: '2026-03-29', reason: 'Unreachable during shift' }
    ];

    const getLeaveRequestsFromDB = () => {
        const teamMembers = db.getUsersByManager(user.emp_id);
        const memberIds = teamMembers.map(m => m.emp_id);
        const allLeaves = db.getAllLeaves();
        
        return allLeaves
            .filter(l => memberIds.includes(l.emp_id))
            .map(l => {
                const emp = teamMembers.find(m => m.emp_id === l.emp_id);
                const empName = emp ? emp.emp_name.split(' (')[0] : 'Employee';
                let type = l.leave_type || '';
                if(type === 'CASUAL') type = 'Vacation';
                else if(type === 'SICK') type = 'Sick Leave';
                else if(type === 'UNPAID') type = 'Personal Leave';
                else if(type === 'EMERGENCY') type = 'Emergency';
                else type = 'Vacation';
                
                let leaveStatus = l.status === 'PENDING' ? 'Pending' :
                                  l.status === 'APPROVED' ? 'Approved' : 'Rejected';

                let days = l.days;
                if (!days && l.start_date && l.end_date) {
                    const d1 = new Date(l.start_date);
                    const d2 = new Date(l.end_date);
                    days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
                }

                return {
                    id: l.leave_id,
                    emp: empName,
                    type: type,
                    start: l.start_date,
                    end: l.end_date,
                    days: days || 1, 
                    reason: l.reason || '',
                    balance: 12, // Mock balance
                    status: leaveStatus
                };
            }).reverse();
    };

    let leaveRequests = [];

    const getLeaveTypeBadge = (type) => {
        let bg, color;
        switch (type) {
            case 'Vacation': bg = 'rgba(107, 33, 168, 0.1)'; color = '#6B21A8'; break; // Purple
            case 'Sick Leave': bg = 'rgba(124, 58, 237, 0.1)'; color = '#7C3AED'; break; // Light Purple
            case 'Personal Leave': bg = 'rgba(167, 139, 250, 0.1)'; color = '#A78BFA'; break; // Lavender
            case 'Emergency': bg = 'rgba(236, 72, 153, 0.1)'; color = '#EC4899'; break; // Pink
            default: bg = 'var(--border-light)'; color = 'var(--text-main)';
        }
        return `<span style="padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px; font-weight: var(--font-bold); background-color: ${bg}; color: ${color};">${type}</span>`;
    };

    const getStatusBadge = (status) => {
        let bg, color;
        if (status === 'Pending') {
            bg = 'rgba(245, 158, 11, 0.1)'; color = 'var(--warning-color)';
        } else if (status === 'Approved') {
            bg = 'rgba(16, 185, 129, 0.1)'; color = 'var(--secondary-color)';
        } else {
            bg = 'rgba(239, 68, 68, 0.1)'; color = 'var(--danger-color)';
        }
        return `<span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 12px; font-weight: var(--font-bold); background-color: ${bg}; color: ${color};">${status}</span>`;
    };

    const updateSummaryCards = () => {
        const reqs = getLeaveRequestsFromDB();
        const pendingCount = reqs.filter(r => r.status === 'Pending').length;
        const approvedCount = reqs.filter(r => r.status === 'Approved').length;
        
        const elPending = document.getElementById('stat-pending');
        if(elPending) elPending.textContent = pendingCount;
        
        const elApproved = document.getElementById('stat-approved');
        if(elApproved) elApproved.textContent = approvedCount;
        
        const elUnauthorized = document.getElementById('stat-unauthorized');
        if(elUnauthorized) elUnauthorized.textContent = unauthorizedData.length;
        
        const elAvailability = document.getElementById('stat-availability');
        if(elAvailability) elAvailability.textContent = '85%';
    };

    const renderUnauthorizedData = () => {
        const tbody = document.getElementById('unauthorized-table-body');
        if (tbody) {
            tbody.innerHTML = unauthorizedData.map(ua => `
                <tr>
                    <td style="padding: var(--spacing-md); font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--text-main);">${ua.id}</td>
                    <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 12px;">
                            ${ua.name.charAt(0)}
                        </div>
                        <span style="font-weight: var(--font-medium);">${ua.name}</span>
                    </td>
                    <td style="padding: var(--spacing-md);">
                        <span style="padding: 4px 8px; border-radius: var(--radius-sm); font-size: 11px; background-color: rgba(239, 68, 68, 0.1); color: var(--danger-color); font-weight: var(--font-bold);">${ua.days} day(s) absent</span>
                    </td>
                    <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${ua.date}</td>
                    <td style="padding: var(--spacing-md); color: var(--text-muted); font-size: var(--text-sm);">${ua.escalated}</td>
                    <td style="padding: var(--spacing-md); color: var(--text-main); font-size: var(--text-sm);">${ua.reason}</td>
                </tr>
            `).join('');
        }
    };

    const renderLeaveRequests = () => {
        leaveRequests = getLeaveRequestsFromDB();
        const filteredLeaves = leaveRequests.filter(lr => lr.status === currentFilter);
        const tbody = document.getElementById('leave-table-body');
        const actionTh = document.getElementById('leave-action-th');
        if (!tbody) return;

        if (actionTh) {
            actionTh.style.display = currentFilter === 'Pending' ? 'table-cell' : 'none';
        }

        tbody.innerHTML = filteredLeaves.map(lr => `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s ease;" class="table-row">
                <td style="padding: var(--spacing-md); font-size: var(--text-sm); color: var(--text-muted);">${lr.id}</td>
                <td style="padding: var(--spacing-md); display:flex; align-items:center; gap:var(--spacing-sm);">
                    <span style="font-weight: var(--font-medium); color: var(--text-main);">${lr.emp}</span>
                </td>
                <td style="padding: var(--spacing-md);">${getLeaveTypeBadge(lr.type)}</td>
                <td style="padding: var(--spacing-md); font-size: var(--text-sm); color: var(--text-main);">
                    ${lr.start === lr.end ? lr.start : `${lr.start} to ${lr.end}`}
                </td>
                <td style="padding: var(--spacing-md); font-size: var(--text-sm); font-weight:var(--font-bold); color: var(--text-main);">${lr.days}</td>
                <td style="padding: var(--spacing-md); padding-right: var(--spacing-xl);">
                    <div style="font-size: var(--text-sm); color: var(--text-main); max-width: 150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${lr.reason}">${lr.reason}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Balance: <b style="color:var(--text-main);">${lr.balance} days</b></div>
                </td>
                <td style="padding: var(--spacing-md);">${getStatusBadge(lr.status)}</td>
                ${currentFilter === 'Pending' ? `
                    <td style="padding: var(--spacing-md);">
                        <div style="display:flex; gap: 8px;">
                            <button class="action-btn approve-btn hover-btn" data-id="${lr.id}" title="Approve" style="padding: 6px 12px; border: none; background-color: var(--secondary-color); color: white; border-radius: var(--radius-md); cursor: pointer; display:flex; align-items:center; gap: 4px; box-shadow: 0 2px 5px rgba(16,185,129,0.3); transition:all 0.2s ease;">
                                <i class="ph ph-check-circle" style="font-size:1.1rem;"></i> Approve
                            </button>
                            <button class="action-btn reject-btn hover-btn" data-id="${lr.id}" title="Reject" style="padding: 6px 12px; border: none; background-color: var(--danger-color); color: white; border-radius: var(--radius-md); cursor: pointer; display:flex; align-items:center; gap: 4px; box-shadow: 0 2px 5px rgba(239,68,68,0.3); transition:all 0.2s ease;">
                                <i class="ph ph-x-circle" style="font-size:1.1rem;"></i> Reject
                            </button>
                        </div>
                    </td>
                ` : ''}
            </tr>
        `).join('');

        if (filteredLeaves.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${currentFilter === 'Pending' ? 8 : 7}" style="padding: var(--spacing-xl); text-align:center; color: var(--text-muted);">No ${currentFilter.toLowerCase()} leave requests found.</td></tr>`;
        }

        bindActionButtons();
    };

    const bindActionButtons = () => {
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                db.updateLeaveStatus(id, 'APPROVED', user.emp_id);
                renderLeaveRequests();
                updateSummaryCards();
            });
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                db.updateLeaveStatus(id, 'REJECTED', user.emp_id);
                renderLeaveRequests();
                updateSummaryCards();
            });
        });
    };

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
            e.target.classList.add('active-filter');
            currentFilter = e.target.getAttribute('data-filter');
            renderLeaveRequests();
        });
    });

    // Escalated Route Integration
    const alertBtn = document.getElementById('alert-escalated-btn');
    if (alertBtn) {
        alertBtn.addEventListener('click', () => {
            window.location.href = 'escalations.html';
        });
    }

    // Init
    updateSummaryCards();
    renderUnauthorizedData();
    renderLeaveRequests();
});

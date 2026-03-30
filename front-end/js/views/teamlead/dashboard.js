// /js/views/teamlead/dashboard.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderTeamLeadDashboard(container) {
    document.getElementById('page-title').textContent = "Team Dashboard";
    const user = auth.getCurrentUser();
    
    const teamMembers = db.getUsersByManager(user.emp_id);
    const teamLeaves = db.getAllLeaves().filter(l => teamMembers.some(m => m.emp_id === l.emp_id) && l.status === 'PENDING');
    
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon primary"><i class="ph-fill ph-users"></i></div>
                <div class="stat-content">
                    <span class="stat-value">${teamMembers.length}</span>
                    <span class="stat-label">Total Team Members</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon warning"><i class="ph-fill ph-clock"></i></div>
                <div class="stat-content">
                    <span class="stat-value">${teamLeaves.length}</span>
                    <span class="stat-label">Pending Leave Requests</span>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-header">
                <h3 style="margin:0; font-size:var(--text-lg);">Team Quick Overview</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Today's Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamMembers.map(member => {
                            const today = new Date().toISOString().split('T')[0];
                            const att = db.getAttendanceForUser(member.emp_id).find(a => a.attendance_date === today);
                            const status = att ? 'PRESENT' : 'ABSENT';
                            const badgeClass = att ? 'badge-success' : 'badge-danger';
                            
                            return `
                            <tr>
                                <td><strong>${member.emp_name}</strong><br><span style="font-size:var(--text-xs);color:var(--text-muted);">${member.email}</span></td>
                                <td>${member.role}</td>
                                <td><span class="badge ${badgeClass}">${status}</span></td>
                                <td>
                                    <a href="#assign-tasks" class="btn btn-outline" style="padding:4px 8px; font-size:var(--text-xs);">Assign Task</a>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

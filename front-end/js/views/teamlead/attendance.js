// /js/views/teamlead/attendance.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderTeamLeadAttendance(container) {
    document.getElementById('page-title').textContent = "Team Attendance Monitor";
    const user = auth.getCurrentUser();
    const teamMembers = db.getUsersByManager(user.emp_id);
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Today's Office Presence (${today})</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamMembers.map(member => {
                            const att = db.getAttendanceForUser(member.emp_id).find(a => a.attendance_date === today);
                            const checkIn = att ? att.check_in_time : '--';
                            const checkOut = att ? (att.check_out_time || 'In Office') : '--';
                            const status = att ? att.status : 'ABSENT';
                            const badge = status === 'PRESENT' ? 'badge-success' : 'badge-danger';
                            
                            return `
                                <tr>
                                    <td>${member.emp_id}</td>
                                    <td><strong>${member.emp_name}</strong></td>
                                    <td>${checkIn}</td>
                                    <td>${checkOut}</td>
                                    <td><span class="badge ${badge}">${status}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

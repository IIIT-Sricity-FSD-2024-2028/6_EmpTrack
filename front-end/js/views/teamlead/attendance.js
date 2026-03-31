// /js/views/teamlead/attendance.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const teamMembers = db.getUsersByManager(user.emp_id);
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('attendance-header').textContent = `Today's Office Presence (${today})`;
    
    const tbody = document.getElementById('attendance-body');
    if (tbody) {
        tbody.innerHTML = teamMembers.map(member => {
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
        }).join('');
    }
});

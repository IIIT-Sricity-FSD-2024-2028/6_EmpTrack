// /js/views/hr/escalations.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderHREscalations(container) {
    document.getElementById('page-title').textContent = "Escalation Management";
    const escalations = db.data.escalation.sort((a,b) => new Date(b.escalation_date) - new Date(a.escalation_date));
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>System Escalations</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Type Focus</th>
                            <th>From (Emp ID)</th>
                            <th>Reason</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${escalations.map(e => `
                            <tr>
                                <td><strong>${e.escalation_id}</strong></td>
                                <td><span class="badge badge-info">${e.reference_type}</span></td>
                                <td>${e.escalated_from}</td>
                                <td style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.escalation_reason}</td>
                                <td>${e.escalation_date}</td>
                                <td>
                                    <span class="badge ${e.status === 'OPEN' ? 'badge-danger' : e.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}">
                                        ${e.status}
                                    </span>
                                </td>
                                <td>
                                    ${e.status === 'OPEN' ? `
                                        <button class="btn btn-primary resolve-btn" data-id="${e.escalation_id}" style="padding:4px 8px; font-size:var(--text-xs);">Resolve</button>
                                    ` : `<span style="font-size:var(--text-xs); color:var(--text-muted);">Closed</span>`}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelectorAll('.resolve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const escId = e.target.getAttribute('data-id');
            const target = db.data.escalation.find(item => item.escalation_id === escId);
            if(target) {
                target.status = 'RESOLVED';
                db.saveData();
                renderHREscalations(container); // Refresh
            }
        });
    });
}

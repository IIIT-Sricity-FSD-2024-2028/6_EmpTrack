// /js/views/platform_admin/workload.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const technicalTbody = document.getElementById('technical-workload-tbody');
    const supportTbody = document.getElementById('support-workload-tbody');

    function statusBadgeClass(status) {
        return status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
    }

    function renderRows(tbody, members, icon) {
        if (members.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="5"><i class="ph ${icon}" style="font-size:28px; display:block; margin-bottom:8px;"></i>No team members found.</td></tr>`;
            return;
        }
        tbody.innerHTML = members.map((m) => `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="cell-name">${escapeHtml(m.emp_name)}</span>
                        <span class="cell-sub">${escapeHtml(m.specialization || '')}</span>
                    </div>
                </td>
                <td><span class="badge ${statusBadgeClass(m.status)}">${escapeHtml(m.status)}</span></td>
                <td>${m.open_tickets}</td>
                <td>${m.in_progress_tickets}</td>
                <td>${m.total_assigned}</td>
            </tr>
        `).join('');
    }

    try {
        const workload = await db.getTeamWorkload();
        renderRows(technicalTbody, workload.technical, 'ph-hard-drives');
        renderRows(supportTbody, workload.support, 'ph-headset');
    } catch (e) {
        const errorRow = `<tr class="error-row"><td colspan="5"><i class="ph ph-warning-circle"></i> Failed to load workload.</td></tr>`;
        technicalTbody.innerHTML = errorRow;
        supportTbody.innerHTML = errorRow;
    }
});

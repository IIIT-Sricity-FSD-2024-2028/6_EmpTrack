// /js/views/hr/dashboard.js
import { db } from '../../store.js';

export function renderHRDashboard(container) {
    document.getElementById('page-title').textContent = "Organization Dashboard (Super User)";
    
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon primary"><i class="ph-fill ph-users"></i></div>
                <div class="stat-content">
                    <span class="stat-value">${db.data.employee.length}</span>
                    <span class="stat-label">Total Personnel</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon danger"><i class="ph-fill ph-siren"></i></div>
                <div class="stat-content">
                    <span class="stat-value">${db.data.escalation.filter(i=>i.status==='OPEN').length}</span>
                    <span class="stat-label">Active Escalations</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 style="margin:0; font-size:var(--text-lg);">System Control Panel</h3>
            </div>
            <p>Welcome to the Super User Interface. You have full CRUD control over the database.</p>
            <div style="display:flex; gap: 10px; margin-top:20px;">
                <button class="btn btn-primary"><i class="ph ph-plus"></i> Add New Employee</button>
                <button class="btn btn-secondary"><i class="ph ph-calendar"></i> Define Holiday Rules</button>
                <button class="btn btn-outline"><i class="ph ph-file-text"></i> Run Master Audit</button>
            </div>
        </div>
    `;
}

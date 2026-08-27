// /js/views/company_admin/employee-management.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, openModal, closeModal, bindModalDismiss } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guard

    const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let employees = [];
    let teams = [];

    ['createTeamModal', 'assignLeadModal'].forEach(bindModalDismiss);

    const tableBody = document.getElementById('empTableBody');
    const teamsTableBody = document.getElementById('teamsTableBody');
    const searchInput = document.getElementById('empSearch');
    const deptFilter = document.getElementById('empDeptFilter');
    const statusFilter = document.getElementById('empStatusFilter');
    const clearBtn = document.getElementById('empClearSort');

    function setStat(id, value) {
        const el = document.getElementById(id);
        if (el) { el.setAttribute('data-val', value); el.innerText = value; }
    }

    function updateSummary() {
        const total = employees.length;
        const active = employees.filter(e => e.status === 'ACTIVE').length;
        const inactive = employees.filter(e => e.status !== 'ACTIVE').length;
        const now = new Date();
        const newThisMonth = employees.filter(e => {
            if (!e.date_of_joining) return false;
            const d = new Date(e.date_of_joining);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        setStat('total-val', total);
        setStat('active-val', active);
        setStat('leave-val', inactive);
        setStat('new-val', newThisMonth);
    }

    // --- Teams ---
    async function loadTeams() {
        try {
            teams = await db.getTeams();
        } catch (e) {
            teams = [];
            showToast('Failed to load teams.', 'error');
        }
        renderTeamsTable();
        populateTeamSelect();
    }

    function renderTeamsTable() {
        if (!teamsTableBody) return;
        if (teams.length === 0) {
            teamsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No teams yet. Create one to get started.</td></tr>`;
            return;
        }
        teamsTableBody.innerHTML = teams.map(t => `
            <tr>
                <td>${escapeHtml(t.team_name)}</td>
                <td>${t.team_lead_name ? escapeHtml(t.team_lead_name) : '<span class="badge inactive">Not assigned</span>'}</td>
                <td>${t.employee_count}</td>
                <td style="text-align:right;">
                    ${!t.team_lead_id ? `<button type="button" class="btn-icon edit-btn" data-assign-lead="${t.team_id}" title="Assign Team Lead" style="background:none; border:none; color:var(--emp-primary); cursor:pointer; font-size:18px;"><i class="ph ph-user-plus"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
        teamsTableBody.querySelectorAll('[data-assign-lead]').forEach(btn => {
            btn.addEventListener('click', () => openAssignLeadModal(btn.getAttribute('data-assign-lead')));
        });
    }

    function populateTeamSelect() {
        const select = document.getElementById('addEmpTeam');
        if (!select) return;
        const withLead = teams.filter(t => t.team_lead_id);
        select.innerHTML = '<option value="" disabled selected>Select Team</option>' +
            withLead.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
        if (withLead.length === 0) {
            select.innerHTML = '<option value="" disabled selected>No teams with a Team Lead yet</option>';
        }
    }

    document.getElementById('btnOpenCreateTeam').addEventListener('click', () => {
        document.getElementById('createTeamForm').reset();
        document.getElementById('createTeamError').style.display = 'none';
        openModal('createTeamModal');
    });

    document.getElementById('btnSubmitCreateTeam').addEventListener('click', async () => {
        const team_name = document.getElementById('ct-name').value.trim();
        const errorEl = document.getElementById('createTeamError');
        if (!team_name) {
            errorEl.textContent = 'Please enter a team name.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createTeam({ team_name });
            showToast('Team created successfully.');
            closeModal('createTeamModal');
            await loadTeams();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to create team.';
            errorEl.style.display = 'block';
        }
    });

    function openAssignLeadModal(teamId) {
        const team = teams.find(t => t.team_id === teamId);
        document.getElementById('assignLeadForm').reset();
        document.getElementById('assignLeadError').style.display = 'none';
        document.getElementById('al-team-id').value = teamId;
        document.getElementById('assignLeadTeamName').textContent = team ? `- ${team.team_name}` : '';
        openModal('assignLeadModal');
    }

    document.getElementById('btnSubmitAssignLead').addEventListener('click', async () => {
        const teamId = document.getElementById('al-team-id').value;
        const data = {
            name: document.getElementById('al-name').value.trim(),
            email: document.getElementById('al-email').value.trim(),
            phone: document.getElementById('al-phone').value.trim(),
            password: document.getElementById('al-password').value,
            confirmPassword: document.getElementById('al-confirm-password').value,
        };
        const errorEl = document.getElementById('assignLeadError');
        if (!data.name || !data.email || !data.phone || !data.password || !data.confirmPassword) {
            errorEl.textContent = 'All fields are required.';
            errorEl.style.display = 'block';
            return;
        }
        if (!EMAIL_RE.test(data.email)) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.style.display = 'block';
            return;
        }
        if (!STRONG_PASSWORD.test(data.password)) {
            errorEl.textContent = 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.';
            errorEl.style.display = 'block';
            return;
        }
        if (data.password !== data.confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createTeamLead(teamId, data);
            showToast('Team Lead assigned successfully.');
            closeModal('assignLeadModal');
            await loadTeams();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to assign Team Lead.';
            errorEl.style.display = 'block';
        }
    });

    // --- Employees ---
    window.handleEmpClick = async (id) => {
        alert('Clicked Employee ID: ' + id + '\n\n(In a full app, this would open the employee profile model or route.)');
    };

    window.currentEditId = null;

    window.handleEmpEdit = async (id) => {
        window.currentEditId = id;
        applyFilters();
    };

    window.handleEmpEditCancel = () => {
        window.currentEditId = null;
        applyFilters();
    };

    window.handleEmpEditSave = async (id) => {
        const updateData = {
            emp_name: document.getElementById('inlineName').value.trim(),
            email: document.getElementById('inlineEmail').value.trim(),
            phone: document.getElementById('inlinePhone').value.trim(),
            department_id: document.getElementById('inlineDept').value,
            status: document.getElementById('inlineStatus').value,
        };
        try {
            await db.updateEmployee(id, updateData);
            showToast('Employee updated successfully.');
            window.currentEditId = null;
            await loadEmployees();
        } catch (e) {
            showToast(e.message || 'Failed to update employee.', 'error');
        }
    };

    window.handleEmpDelete = async (id) => {
        if (!confirm('Are you sure you want to delete employee ' + id + '?')) return;
        try {
            await db.deleteEmployee(id);
            showToast('Employee deleted successfully.');
            await loadEmployees();
        } catch (e) {
            showToast(e.message || 'Failed to delete employee.', 'error');
        }
    };

    function teamNameFor(teamId) {
        const t = teams.find(x => x.team_id === teamId);
        return t ? t.team_name : '-';
    }

    function teamLeadNameFor(teamId) {
        const t = teams.find(x => x.team_id === teamId);
        return t && t.team_lead_name ? t.team_lead_name : '-';
    }

    function renderRows(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color:var(--text-muted);">No employees found matching your criteria.</td></tr>`;
            return;
        }

        data.forEach(emp => {
            const badgeCls = emp.status === 'ACTIVE' ? 'active' : 'inactive';

            const tr = document.createElement('tr');
            if (emp.emp_id === window.currentEditId) {
                tr.innerHTML = `
                    <td>${emp.emp_id}</td>
                    <td style="min-width: 200px;">
                        <input type="text" id="inlineName" value="${escapeHtml(emp.emp_name)}" placeholder="Name" style="width:100%; margin-bottom:4px; padding:4px; border:1px solid #ccc; border-radius:4px;" />
                        <input type="email" id="inlineEmail" value="${escapeHtml(emp.email)}" placeholder="Email" style="width:100%; margin-bottom:4px; font-size:12px; padding:4px; border:1px solid #ccc; border-radius:4px;" />
                        <input type="text" id="inlinePhone" value="${escapeHtml(emp.phone || '')}" placeholder="Phone" style="width:100%; font-size:12px; padding:4px; border:1px solid #ccc; border-radius:4px;" />
                    </td>
                    <td style="min-width: 160px;">
                        <select id="inlineDept" style="width:100%; padding:4px; border:1px solid #ccc; border-radius:4px;">
                            <option value="Engineering" ${emp.department_id==='Engineering'?'selected':''}>Engineering</option>
                            <option value="Design" ${emp.department_id==='Design'?'selected':''}>Design</option>
                            <option value="Marketing" ${emp.department_id==='Marketing'?'selected':''}>Marketing</option>
                            <option value="Sales" ${emp.department_id==='Sales'?'selected':''}>Sales</option>
                            <option value="HR" ${emp.department_id==='HR'?'selected':''}>HR</option>
                        </select>
                    </td>
                    <td>${teamNameFor(emp.team_id)}</td>
                    <td>${teamLeadNameFor(emp.team_id)}</td>
                    <td>${emp.date_of_joining || '-'}</td>
                    <td>
                        <select id="inlineStatus" style="width:100%; padding:4px; border:1px solid #ccc; border-radius:4px;">
                            <option value="ACTIVE" ${emp.status==='ACTIVE'?'selected':''}>Active</option>
                            <option value="INACTIVE" ${emp.status==='INACTIVE'?'selected':''}>Inactive</option>
                        </select>
                    </td>
                    <td style="text-align: center;">
                        <button class="btn-icon" onclick="handleEmpEditSave('${emp.emp_id}')" title="Save" style="background:none; border:none; color:var(--emp-success); cursor:pointer; font-size:18px; margin-right:8px;">
                            <i class="ph-bold ph-check"></i>
                        </button>
                        <button class="btn-icon" onclick="handleEmpEditCancel()" title="Cancel" style="background:none; border:none; color:var(--emp-danger); cursor:pointer; font-size:18px;">
                            <i class="ph-bold ph-x"></i>
                        </button>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td><a href="javascript:void(0)" class="emp-id-link" onclick="handleEmpClick('${emp.emp_id}')">${emp.emp_id}</a></td>
                    <td>
                        <div class="emp-name-col">
                            <span class="emp-name">${escapeHtml(emp.emp_name)}</span>
                            <span class="emp-email" style="margin-bottom:2px;">${escapeHtml(emp.email)}</span>
                            <span style="font-size:12px; color:var(--text-muted);"><i class="ph ph-phone" style="vertical-align:middle; margin-right:2px;"></i> ${escapeHtml(emp.phone || 'N/A')}</span>
                        </div>
                    </td>
                    <td>${escapeHtml(emp.department_id || '-')}</td>
                    <td>${escapeHtml(teamNameFor(emp.team_id))}</td>
                    <td>${escapeHtml(teamLeadNameFor(emp.team_id))}</td>
                    <td>${emp.date_of_joining || '-'}</td>
                    <td><span class="badge ${badgeCls}">${escapeHtml(emp.status)}</span></td>
                    <td style="text-align: center;">
                        <button class="btn-icon edit-btn" onclick="handleEmpEdit('${emp.emp_id}')" title="Edit Employee" style="background:none; border:none; color:var(--emp-primary); cursor:pointer; font-size:18px; margin-right:8px;">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="handleEmpDelete('${emp.emp_id}')" title="Delete Employee" style="background:none; border:none; color:var(--emp-danger); cursor:pointer; font-size:18px;">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                `;
            }
            tableBody.appendChild(tr);
        });
    }

    function applyFilters() {
        const query = (searchInput.value || '').toLowerCase();
        const dept = deptFilter.value;
        const status = statusFilter.value;

        const filtered = employees.filter(e => {
            const mText = e.emp_name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || e.emp_id.toLowerCase().includes(query);
            const mDept = dept === 'all' || e.department_id === dept;
            const mStatus = status === 'all' || e.status === status;
            return mText && mDept && mStatus;
        });

        renderRows(filtered);
    }

    async function loadEmployees() {
        try {
            const all = await db.getEmployees();
            employees = all.filter(e => e.role === 'EMPLOYEE');
        } catch (e) {
            employees = [];
            showToast('Failed to load employees.', 'error');
        }
        updateSummary();
        applyFilters();
    }

    // Bind events
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (deptFilter) deptFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            deptFilter.value = 'all';
            statusFilter.value = 'all';
            applyFilters();
        });
    }

    // Team select -> auto-fill readonly Team Lead field
    document.getElementById('addEmpTeam').addEventListener('change', (e) => {
        const team = teams.find(t => t.team_id === e.target.value);
        document.getElementById('addEmpTeamLead').value = team ? team.team_lead_name : '';
    });

    // Add Employee Logic
    const addEmpForm = document.getElementById('addEmpForm');
    const addEmpSuccess = document.getElementById('addEmpSuccess');
    const addEmpError = document.getElementById('addEmpError');
    if (addEmpForm) {
        addEmpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            addEmpError.style.display = 'none';

            if (!addEmpForm.checkValidity()) {
                addEmpForm.reportValidity();
                return;
            }

            const data = {
                name: document.getElementById('addEmpName').value.trim(),
                email: document.getElementById('addEmpEmail').value.trim(),
                phone: document.getElementById('addEmpPhone').value.trim(),
                password: document.getElementById('addEmpPassword').value,
                confirmPassword: document.getElementById('addEmpConfirmPassword').value,
                department_id: document.getElementById('addEmpDept').value,
                team_id: document.getElementById('addEmpTeam').value,
            };

            if (!EMAIL_RE.test(data.email)) {
                addEmpError.textContent = 'Please enter a valid email address.';
                addEmpError.style.display = 'block';
                return;
            }
            if (!/^[0-9+\-\s()]{7,15}$/.test(data.phone)) {
                addEmpError.textContent = 'Please enter a valid phone number.';
                addEmpError.style.display = 'block';
                return;
            }
            if (!STRONG_PASSWORD.test(data.password)) {
                addEmpError.textContent = 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.';
                addEmpError.style.display = 'block';
                return;
            }
            if (data.password !== data.confirmPassword) {
                addEmpError.textContent = 'Passwords do not match.';
                addEmpError.style.display = 'block';
                return;
            }
            if (!data.team_id) {
                addEmpError.textContent = 'Please select a team.';
                addEmpError.style.display = 'block';
                return;
            }

            try {
                await db.createEmployeeAccount(data);
                await loadEmployees();

                addEmpSuccess.style.display = 'block';
                addEmpForm.reset();
                document.getElementById('addEmpTeamLead').value = '';
                setTimeout(() => { addEmpSuccess.style.display = 'none'; }, 3000);
            } catch (err) {
                addEmpError.textContent = err.message || 'Failed to add employee.';
                addEmpError.style.display = 'block';
            }
        });
    }

    await loadTeams();
    await loadEmployees();
});

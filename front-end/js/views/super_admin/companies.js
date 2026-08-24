// /js/views/super_admin/companies.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import {
    escapeHtml, showToast, openModal, closeModal, bindModalDismiss,
    debounce, formatDate, paginate, renderPagination,
} from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 8;
    let companies = [];
    let plans = [];
    let activePlatformAdmins = [];
    let page = 1;
    let searchTerm = '';
    let statusFilter = 'all';

    const tbody = document.getElementById('companies-tbody');
    const pagerEl = document.getElementById('companies-pagination');
    const noAdminBanner = document.getElementById('no-admin-banner');
    const btnOpenCreate = document.getElementById('btn-open-create');

    ['createCompanyModal', 'editCompanyModal', 'viewCompanyModal', 'reassignModal', 'statusConfirmModal'].forEach(bindModalDismiss);

    function statusBadgeClass(status) {
        if (status === 'ACTIVE') return 'badge-active';
        if (status === 'SUSPENDED') return 'badge-suspended';
        return 'badge-inactive';
    }

    function renderPlanOptions(selectEl, selectedId) {
        selectEl.innerHTML = plans
            .filter((p) => p.status === 'ACTIVE' || p.plan_id === selectedId)
            .map((p) => `<option value="${p.plan_id}" ${p.plan_id === selectedId ? 'selected' : ''}>${escapeHtml(p.name)} - $${p.price}/${p.billing_cycle === 'MONTHLY' ? 'mo' : 'yr'}</option>`)
            .join('');
    }

    function renderPlatformAdminOptions(selectEl, selectedId) {
        selectEl.innerHTML = activePlatformAdmins
            .map((a) => `<option value="${a.emp_id}" ${a.emp_id === selectedId ? 'selected' : ''}>${escapeHtml(a.emp_name)} (${a.assigned_company_count} companies)</option>`)
            .join('');
    }

    async function loadLookups() {
        const [planList, adminList, activeCount] = await Promise.all([
            db.getSubscriptionPlans(),
            db.getPlatformAdmins({ status: 'ACTIVE' }),
            db.getActivePlatformAdminCount(),
        ]);
        plans = planList;
        activePlatformAdmins = adminList;
        const hasActiveAdmin = activeCount.count > 0;
        noAdminBanner.style.display = hasActiveAdmin ? 'none' : 'flex';
        btnOpenCreate.disabled = !hasActiveAdmin;
        btnOpenCreate.classList.toggle('action-btn-disabled', !hasActiveAdmin);
    }

    async function loadCompanies() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading companies...</div></td></tr>`;
        try {
            companies = await db.getCompanies({ status: statusFilter, search: searchTerm });
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="8"><i class="ph ph-warning-circle"></i> Failed to load companies.</td></tr>`;
        }
    }

    function renderTable() {
        if (companies.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><i class="ph ph-buildings" style="font-size:28px; display:block; margin-bottom:8px;"></i>No companies found matching your criteria.</td></tr>`;
            pagerEl.innerHTML = '';
            return;
        }

        const { pageItems, page: safePage, totalPages, total } = paginate(companies, page, PAGE_SIZE);
        page = safePage;

        tbody.innerHTML = pageItems.map((c) => `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="cell-name"><a href="#" data-view="${c.company_id}">${escapeHtml(c.company_name)}</a></span>
                        <span class="cell-sub">${escapeHtml(c.industry)}</span>
                    </div>
                </td>
                <td>${escapeHtml(c.company_email)}</td>
                <td><span class="badge ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
                <td>${escapeHtml(c.subscription_plan_name || '-')}</td>
                <td>${escapeHtml(c.platform_admin_name || 'Unassigned')}</td>
                <td>${c.employee_count}</td>
                <td>${formatDate(c.created_date)}</td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="View" data-view="${c.company_id}"><i class="ph ph-eye"></i></button>
                        <button class="icon-btn" title="Edit" data-edit="${c.company_id}"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn" title="Reassign Platform Admin" data-reassign="${c.company_id}"><i class="ph ph-arrows-left-right"></i></button>
                        ${c.status === 'ACTIVE'
                            ? `<button class="icon-btn" title="Deactivate" data-status="${c.company_id}|INACTIVE|${escapeHtml(c.company_name)}"><i class="ph ph-pause-circle"></i></button>
                               <button class="icon-btn danger" title="Suspend" data-status="${c.company_id}|SUSPENDED|${escapeHtml(c.company_name)}"><i class="ph ph-prohibit"></i></button>`
                            : `<button class="icon-btn" title="Activate" data-status="${c.company_id}|ACTIVE|${escapeHtml(c.company_name)}"><i class="ph ph-check-circle"></i></button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination(pagerEl, { page, totalPages, total, pageSize: PAGE_SIZE }, (p) => { page = p; renderTable(); });
        bindRowActions();
    }

    function bindRowActions() {
        tbody.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openViewModal(btn.getAttribute('data-view')); }));
        tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-edit'))));
        tbody.querySelectorAll('[data-reassign]').forEach((btn) => btn.addEventListener('click', () => openReassignModal(btn.getAttribute('data-reassign'))));
        tbody.querySelectorAll('[data-status]').forEach((btn) => btn.addEventListener('click', () => {
            const [id, newStatus, name] = btn.getAttribute('data-status').split('|');
            openStatusConfirm(id, name, newStatus);
        }));
    }

    function openViewModal(id) {
        const c = companies.find((x) => x.company_id === id);
        if (!c) return;
        document.getElementById('view-company-body').innerHTML = `
            <div class="detail-item"><span class="detail-label">Company Name</span><span class="detail-value">${escapeHtml(c.company_name)}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="badge ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></div>
            <div class="detail-item"><span class="detail-label">Contact Email</span><span class="detail-value">${escapeHtml(c.company_email)}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${escapeHtml(c.phone)}</span></div>
            <div class="detail-item"><span class="detail-label">Industry</span><span class="detail-value">${escapeHtml(c.industry)}</span></div>
            <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${formatDate(c.created_date)}</span></div>
            <div class="detail-item" style="grid-column:1/-1;"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(c.address)}</span></div>
            <div class="detail-item"><span class="detail-label">Subscription Plan</span><span class="detail-value">${escapeHtml(c.subscription_plan_name || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">Employees</span><span class="detail-value">${c.employee_count}</span></div>
            <div class="detail-item"><span class="detail-label">Platform Admin</span><span class="detail-value">${escapeHtml(c.platform_admin_name || 'Unassigned')}</span></div>
            <div class="detail-item"><span class="detail-label">Company Admin</span><span class="detail-value">${escapeHtml(c.company_admin_name || 'Invitation pending')}${c.company_admin_status === 'PENDING' ? ' <span class="badge badge-pending">Pending</span>' : ''}</span></div>
        `;
        openModal('viewCompanyModal');
    }

    function openEditModal(id) {
        const c = companies.find((x) => x.company_id === id);
        if (!c) return;
        document.getElementById('ec-id').value = c.company_id;
        document.getElementById('ec-name').value = c.company_name;
        document.getElementById('ec-email').value = c.company_email;
        document.getElementById('ec-phone').value = c.phone;
        document.getElementById('ec-industry').value = c.industry;
        document.getElementById('ec-address').value = c.address;
        renderPlanOptions(document.getElementById('ec-plan'), c.subscription_plan_id);
        document.getElementById('edit-company-error').style.display = 'none';
        openModal('editCompanyModal');
    }

    function openReassignModal(id) {
        document.getElementById('ra-company-id').value = id;
        const c = companies.find((x) => x.company_id === id);
        renderPlatformAdminOptions(document.getElementById('ra-platform-admin'), c ? c.platform_admin_id : null);
        openModal('reassignModal');
    }

    let pendingStatusChange = null;
    function openStatusConfirm(id, name, newStatus) {
        pendingStatusChange = { id, newStatus };
        const verb = newStatus === 'ACTIVE' ? 'activate' : newStatus === 'SUSPENDED' ? 'suspend' : 'deactivate';
        document.getElementById('status-confirm-title').textContent = `${verb.charAt(0).toUpperCase() + verb.slice(1)} Company`;
        document.getElementById('status-confirm-text').textContent = `Are you sure you want to ${verb} "${name}"?`;
        openModal('statusConfirmModal');
    }

    document.getElementById('btn-confirm-status').addEventListener('click', async () => {
        if (!pendingStatusChange) return;
        try {
            await db.updateCompanyStatus(pendingStatusChange.id, pendingStatusChange.newStatus);
            showToast('Company status updated successfully.');
            closeModal('statusConfirmModal');
            await loadCompanies();
        } catch (e) {
            showToast(e.message || 'Failed to update status.', 'error');
        }
    });

    document.getElementById('btn-submit-reassign').addEventListener('click', async () => {
        const id = document.getElementById('ra-company-id').value;
        const platformAdminId = document.getElementById('ra-platform-admin').value;
        try {
            await db.reassignCompanyPlatformAdmin(id, platformAdminId);
            showToast('Platform Admin reassigned successfully.');
            closeModal('reassignModal');
            await loadCompanies();
        } catch (e) {
            showToast(e.message || 'Failed to reassign.', 'error');
        }
    });

    document.getElementById('btn-submit-edit').addEventListener('click', async () => {
        const id = document.getElementById('ec-id').value;
        const data = {
            company_name: document.getElementById('ec-name').value.trim(),
            company_email: document.getElementById('ec-email').value.trim(),
            phone: document.getElementById('ec-phone').value.trim(),
            industry: document.getElementById('ec-industry').value.trim(),
            address: document.getElementById('ec-address').value.trim(),
            subscription_plan_id: document.getElementById('ec-plan').value,
        };
        const errorEl = document.getElementById('edit-company-error');
        if (!data.company_name || !data.company_email) {
            errorEl.textContent = 'Company name and email are required.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.updateCompany(id, data);
            showToast('Company updated successfully.');
            closeModal('editCompanyModal');
            await loadCompanies();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to update company.';
            errorEl.style.display = 'block';
        }
    });

    btnOpenCreate.addEventListener('click', () => {
        if (btnOpenCreate.disabled) return;
        document.getElementById('create-company-form').reset();
        document.getElementById('create-company-error').style.display = 'none';
        renderPlanOptions(document.getElementById('cc-plan'), plans.length ? plans[0].plan_id : null);
        renderPlatformAdminOptions(document.getElementById('cc-platform-admin'), null);
        openModal('createCompanyModal');
    });

    document.getElementById('btn-submit-create').addEventListener('click', async () => {
        const data = {
            company_name: document.getElementById('cc-name').value.trim(),
            company_email: document.getElementById('cc-email').value.trim(),
            phone: document.getElementById('cc-phone').value.trim(),
            industry: document.getElementById('cc-industry').value.trim(),
            address: document.getElementById('cc-address').value.trim(),
            subscription_plan_id: document.getElementById('cc-plan').value,
            status: document.getElementById('cc-status').value,
            admin_name: document.getElementById('cc-admin-name').value.trim(),
            admin_email: document.getElementById('cc-admin-email').value.trim(),
            admin_phone: document.getElementById('cc-admin-phone').value.trim(),
            platform_admin_id: document.getElementById('cc-platform-admin').value,
        };
        const errorEl = document.getElementById('create-company-error');
        const required = ['company_name', 'company_email', 'phone', 'industry', 'address', 'subscription_plan_id', 'admin_name', 'admin_email', 'admin_phone', 'platform_admin_id'];
        if (required.some((key) => !data[key])) {
            errorEl.textContent = 'Please fill in all required fields.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            const result = await db.createCompany(data);
            showToast('Company created successfully. Company Admin invitation sent. Platform Admin assigned successfully.');
            closeModal('createCompanyModal');
            if (result.invitation && result.invitation.token) {
                const link = `${window.location.origin}/front-end/accept-invitation.html?token=${result.invitation.token}`;
                window.prompt(`Invitation link for ${data.admin_email} (no real email server is configured - copy and share this link):`, link);
            }
            await Promise.all([loadLookups(), loadCompanies()]);
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to create company.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        searchTerm = e.target.value.trim();
        page = 1;
        loadCompanies();
    }, 350));

    document.getElementById('status-filter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        page = 1;
        loadCompanies();
    });

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        searchTerm = '';
        statusFilter = 'all';
        document.getElementById('search-input').value = '';
        document.getElementById('status-filter').value = 'all';
        page = 1;
        loadCompanies();
    });

    try {
        await loadLookups();
    } catch (e) {
        showToast('Failed to load platform admins / plans.', 'error');
    }
    await loadCompanies();
});

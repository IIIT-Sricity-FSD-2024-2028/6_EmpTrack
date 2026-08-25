// /js/views/platform_admin/my-companies.js
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
    let allCompanies = [];
    let page = 1;
    let searchTerm = '';
    let statusFilter = 'all';

    const tbody = document.getElementById('companies-tbody');
    const pagerEl = document.getElementById('companies-pagination');

    bindModalDismiss('viewCompanyModal');
    bindModalDismiss('createCaModal');

    function statusBadgeClass(status) {
        if (status === 'ACTIVE') return 'badge-active';
        if (status === 'SUSPENDED') return 'badge-suspended';
        return 'badge-inactive';
    }

    async function loadCompanies() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading companies...</div></td></tr>`;
        try {
            let all = await db.getMyCompanies();
            allCompanies = all;
            if (statusFilter !== 'all') all = all.filter((c) => c.status === statusFilter);
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                all = all.filter((c) => c.company_name.toLowerCase().includes(q) || c.company_email.toLowerCase().includes(q));
            }
            companies = all;
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
                <td>${escapeHtml(c.company_admin_name || 'Invitation pending')}</td>
                <td>${c.employee_count}</td>
                <td>${formatDate(c.created_date)}</td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="View" data-view="${c.company_id}"><i class="ph ph-eye"></i></button>
                        <button class="icon-btn" title="Add Company Admin" data-add-admin="${c.company_id}"><i class="ph ph-user-plus"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination(pagerEl, { page, totalPages, total, pageSize: PAGE_SIZE }, (p) => { page = p; renderTable(); });
        tbody.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openViewModal(btn.getAttribute('data-view')); }));
        tbody.querySelectorAll('[data-add-admin]').forEach((btn) => btn.addEventListener('click', () => openCreateCaModal(btn.getAttribute('data-add-admin'))));
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
            <div class="detail-item"><span class="detail-label">Company Admin</span><span class="detail-value">${escapeHtml(c.company_admin_name || 'Invitation pending')}${c.company_admin_status === 'PENDING' ? ' <span class="badge badge-pending">Pending</span>' : ''}</span></div>
        `;
        openModal('viewCompanyModal');
    }

    const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function openCreateCaModal(preselectCompanyId) {
        document.getElementById('create-ca-form').reset();
        document.getElementById('create-ca-error').style.display = 'none';
        const select = document.getElementById('cca-company');
        select.innerHTML = '<option value="">Select a company...</option>' +
            allCompanies.map((c) => `<option value="${c.company_id}">${escapeHtml(c.company_name)}</option>`).join('');
        if (preselectCompanyId) select.value = preselectCompanyId;
        openModal('createCaModal');
    }

    document.getElementById('btn-open-create-ca').addEventListener('click', () => openCreateCaModal());

    document.getElementById('btn-submit-create-ca').addEventListener('click', async () => {
        const companyId = document.getElementById('cca-company').value;
        const data = {
            name: document.getElementById('cca-name').value.trim(),
            email: document.getElementById('cca-email').value.trim(),
            phone: document.getElementById('cca-phone').value.trim(),
            password: document.getElementById('cca-password').value,
            confirmPassword: document.getElementById('cca-confirm-password').value,
            status: document.getElementById('cca-status').value,
        };
        const errorEl = document.getElementById('create-ca-error');
        if (!companyId || !data.name || !data.email || !data.phone || !data.password || !data.confirmPassword) {
            errorEl.textContent = 'All fields are required.';
            errorEl.style.display = 'block';
            return;
        }
        if (!EMAIL_RE.test(data.email)) {
            errorEl.textContent = 'Enter a valid email address.';
            errorEl.style.display = 'block';
            return;
        }
        if (!STRONG_PASSWORD.test(data.password)) {
            errorEl.textContent = 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.';
            errorEl.style.display = 'block';
            return;
        }
        if (data.password !== data.confirmPassword) {
            errorEl.textContent = 'Password and confirmation do not match.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createCompanyAdmin(companyId, data);
            showToast('Company Admin created successfully. They can log in immediately.');
            closeModal('createCaModal');
            await loadCompanies();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to create Company Admin.';
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

    await loadCompanies();
});

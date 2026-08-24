// /js/views/platform_admin/my-companies.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import {
    escapeHtml, openModal, bindModalDismiss,
    debounce, formatDate, paginate, renderPagination,
} from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 8;
    let companies = [];
    let page = 1;
    let searchTerm = '';
    let statusFilter = 'all';

    const tbody = document.getElementById('companies-tbody');
    const pagerEl = document.getElementById('companies-pagination');

    bindModalDismiss('viewCompanyModal');

    function statusBadgeClass(status) {
        if (status === 'ACTIVE') return 'badge-active';
        if (status === 'SUSPENDED') return 'badge-suspended';
        return 'badge-inactive';
    }

    async function loadCompanies() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading companies...</div></td></tr>`;
        try {
            let all = await db.getMyCompanies();
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
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination(pagerEl, { page, totalPages, total, pageSize: PAGE_SIZE }, (p) => { page = p; renderTable(); });
        tbody.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openViewModal(btn.getAttribute('data-view')); }));
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

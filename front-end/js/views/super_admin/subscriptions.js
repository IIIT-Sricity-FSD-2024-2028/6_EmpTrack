// /js/views/super_admin/subscriptions.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, openModal, closeModal, bindModalDismiss, formatCurrency } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let plans = [];
    const tbody = document.getElementById('plans-tbody');

    ['createPlanModal', 'editPlanModal', 'planCompaniesModal', 'statusConfirmModal'].forEach(bindModalDismiss);

    async function loadPlans() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="6"><div class="spinner"></div><div>Loading plans...</div></td></tr>`;
        try {
            plans = await db.getSubscriptionPlans();
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="6"><i class="ph ph-warning-circle"></i> Failed to load subscription plans.</td></tr>`;
        }
    }

    function renderTable() {
        if (plans.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><i class="ph ph-credit-card" style="font-size:28px; display:block; margin-bottom:8px;"></i>No subscription plans yet.</td></tr>`;
            return;
        }
        tbody.innerHTML = plans.map((p) => `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="cell-name">${escapeHtml(p.name)}</span>
                        <div class="plan-features">
                            ${(p.features || []).slice(0, 3).map((f) => `<span class="plan-feature-tag">${escapeHtml(f)}</span>`).join('')}
                            ${(p.features || []).length > 3 ? `<span class="plan-feature-tag">+${p.features.length - 3} more</span>` : ''}
                        </div>
                    </div>
                </td>
                <td>${formatCurrency(p.price)}</td>
                <td>${p.billing_cycle === 'MONTHLY' ? 'Monthly' : 'Annual'}</td>
                <td><button class="pa-companies-chip" data-companies="${p.plan_id}" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:var(--bg-main);border:1px solid var(--border-color);border-radius:20px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--text-main);"><i class="ph ph-buildings"></i> ${p.company_count}</button></td>
                <td><span class="badge ${p.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">${escapeHtml(p.status)}</span></td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="Edit" data-edit="${p.plan_id}"><i class="ph ph-pencil-simple"></i></button>
                        ${p.status === 'ACTIVE'
                            ? `<button class="icon-btn danger" title="Deactivate" data-status="${p.plan_id}|INACTIVE|${escapeHtml(p.name)}"><i class="ph ph-pause-circle"></i></button>`
                            : `<button class="icon-btn" title="Activate" data-status="${p.plan_id}|ACTIVE|${escapeHtml(p.name)}"><i class="ph ph-check-circle"></i></button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
        bindRowActions();
    }

    function bindRowActions() {
        tbody.querySelectorAll('[data-companies]').forEach((btn) => btn.addEventListener('click', () => openCompaniesModal(btn.getAttribute('data-companies'))));
        tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-edit'))));
        tbody.querySelectorAll('[data-status]').forEach((btn) => btn.addEventListener('click', () => {
            const [id, newStatus, name] = btn.getAttribute('data-status').split('|');
            openStatusConfirm(id, name, newStatus);
        }));
    }

    async function openCompaniesModal(id) {
        const plan = plans.find((p) => p.plan_id === id);
        document.getElementById('plan-companies-title').textContent = `Companies on ${plan ? plan.name : 'Plan'}`;
        const body = document.getElementById('plan-companies-body');
        body.innerHTML = `<div class="spinner"></div>`;
        openModal('planCompaniesModal');
        try {
            const companies = await db.getCompaniesForPlan(id);
            if (companies.length === 0) {
                body.innerHTML = `<div class="empty-state"><i class="ph ph-buildings"></i> No companies are on this plan yet.</div>`;
                return;
            }
            body.innerHTML = companies.map((c) => `
                <div class="company-list-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light);">
                    <span>${escapeHtml(c.company_name)}</span>
                    <span class="badge ${c.status === 'ACTIVE' ? 'badge-active' : c.status === 'SUSPENDED' ? 'badge-suspended' : 'badge-inactive'}">${escapeHtml(c.status)}</span>
                </div>
            `).join('');
        } catch (e) {
            body.innerHTML = `<div class="error-state"><i class="ph ph-warning-circle"></i> Failed to load companies.</div>`;
        }
    }

    function openEditModal(id) {
        const p = plans.find((x) => x.plan_id === id);
        if (!p) return;
        document.getElementById('ep-id').value = p.plan_id;
        document.getElementById('ep-name').value = p.name;
        document.getElementById('ep-price').value = p.price;
        document.getElementById('ep-cycle').value = p.billing_cycle;
        document.getElementById('ep-max-emp').value = p.max_employees || '';
        document.getElementById('ep-features').value = (p.features || []).join(', ');
        document.getElementById('edit-plan-error').style.display = 'none';
        openModal('editPlanModal');
    }

    let pendingStatusChange = null;
    function openStatusConfirm(id, name, newStatus) {
        pendingStatusChange = { id, newStatus };
        const verb = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
        document.getElementById('status-confirm-title').textContent = `${verb.charAt(0).toUpperCase() + verb.slice(1)} Plan`;
        document.getElementById('status-confirm-text').textContent = `Are you sure you want to ${verb} "${name}"?`;
        openModal('statusConfirmModal');
    }

    document.getElementById('btn-confirm-status').addEventListener('click', async () => {
        if (!pendingStatusChange) return;
        try {
            await db.updateSubscriptionPlanStatus(pendingStatusChange.id, pendingStatusChange.newStatus);
            showToast('Plan status updated successfully.');
            closeModal('statusConfirmModal');
            await loadPlans();
        } catch (e) {
            showToast(e.message || 'Failed to update status.', 'error');
        }
    });

    document.getElementById('btn-submit-edit-plan').addEventListener('click', async () => {
        const id = document.getElementById('ep-id').value;
        const data = {
            name: document.getElementById('ep-name').value.trim(),
            price: Number(document.getElementById('ep-price').value),
            billing_cycle: document.getElementById('ep-cycle').value,
            max_employees: document.getElementById('ep-max-emp').value ? Number(document.getElementById('ep-max-emp').value) : undefined,
            features: document.getElementById('ep-features').value.split(',').map((f) => f.trim()).filter(Boolean),
        };
        const errorEl = document.getElementById('edit-plan-error');
        if (!data.name || isNaN(data.price)) {
            errorEl.textContent = 'Plan name and a valid price are required.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.updateSubscriptionPlan(id, data);
            showToast('Plan updated successfully.');
            closeModal('editPlanModal');
            await loadPlans();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to update plan.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('btn-open-create').addEventListener('click', () => {
        document.getElementById('create-plan-form').reset();
        document.getElementById('create-plan-error').style.display = 'none';
        openModal('createPlanModal');
    });

    document.getElementById('btn-submit-create-plan').addEventListener('click', async () => {
        const data = {
            name: document.getElementById('cp-name').value.trim(),
            price: Number(document.getElementById('cp-price').value),
            billing_cycle: document.getElementById('cp-cycle').value,
            max_employees: document.getElementById('cp-max-emp').value ? Number(document.getElementById('cp-max-emp').value) : undefined,
            features: document.getElementById('cp-features').value.split(',').map((f) => f.trim()).filter(Boolean),
        };
        const errorEl = document.getElementById('create-plan-error');
        if (!data.name || isNaN(data.price)) {
            errorEl.textContent = 'Plan name and a valid price are required.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createSubscriptionPlan(data);
            showToast('Subscription plan created successfully.');
            closeModal('createPlanModal');
            await loadPlans();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to create plan.';
            errorEl.style.display = 'block';
        }
    });

    await loadPlans();
});

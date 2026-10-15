// Converted from front-end/super_admin/subscriptions.html + js/views/super_admin/subscriptions.js
import { useCallback, useEffect, useState } from 'react';
import SaModal from '../../components/sa-common/SaModal';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import { Field, FormError, StateRow, useFormState } from '../../components/sa-common/saForm';
import useFormValidation from '../../hooks/useFormValidation';
import { planSchema } from '../../validation/formSchemas';
import useSaToast from '../../components/sa-common/useSaToast';
import * as sa from '../../services/superAdminService';
import { companyStatusBadgeClass, formatCurrency } from '../../utils/saCommon';
import { SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/platform-admins.css';
import './styles/subscriptions.css';

const COLS = 6;
const EMPTY_PLAN = { name: '', price: '', billing_cycle: 'MONTHLY', max_employees: '', features: '' };

/** Form values -> request body (same conversions as the original). */
function toPlanData(v) {
  return {
    name: v.name.trim(),
    price: Number(v.price),
    billing_cycle: v.billing_cycle,
    max_employees: v.max_employees ? Number(v.max_employees) : undefined,
    features: v.features.split(',').map((f) => f.trim()).filter(Boolean),
  };
}

function PlanFields({ form, prefix, validation }) {
  const bind = (key, id) => ({ ...form.bind(key), ...validation.input(key, id) });
  return (
    <>
      <Field label="Plan Name" htmlFor={`${prefix}-name`} required error={validation.errors.name}>
        <input type="text" className="form-control" aria-required="true" maxLength={60} placeholder={prefix === 'cp' ? 'e.g. Basic, Professional, Enterprise' : undefined} {...bind('name', `${prefix}-name`)} />
      </Field>
      <div className="form-grid">
        <Field label="Price (USD)" htmlFor={`${prefix}-price`} required error={validation.errors.price}><input type="number" min="0" step="0.01" inputMode="decimal" aria-required="true" className="form-control" {...bind('price', `${prefix}-price`)} /></Field>
        <Field label="Billing Cycle" htmlFor={`${prefix}-cycle`} required error={validation.errors.billing_cycle}>
          <select className="form-control" aria-required="true" {...bind('billing_cycle', `${prefix}-cycle`)}>
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </Field>
      </div>
      <Field label="Max Employees" htmlFor={`${prefix}-max-emp`} error={validation.errors.max_employees}>
        <input type="number" min="1" step="1" className="form-control" placeholder={prefix === 'cp' ? 'e.g. 50' : undefined} {...bind('max_employees', `${prefix}-max-emp`)} />
      </Field>
      <Field label="Features (comma-separated)" htmlFor={`${prefix}-features`} error={validation.errors.features}>
        <input type="text" className="form-control" maxLength={3000} placeholder={prefix === 'cp' ? 'Attendance Tracking, Leave Management, ...' : undefined} {...bind('features', `${prefix}-features`)} />
      </Field>
    </>
  );
}

export default function SaSubscriptions() {
  const [toast, showToast] = useSaToast();
  const [plans, setPlans] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'companies' | 'status'
  const [selected, setSelected] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [planCompanies, setPlanCompanies] = useState(null); // null loading | 'error' | []
  const [error, setError] = useState('');
  const createForm = useFormState(EMPTY_PLAN);
  const editForm = useFormState(EMPTY_PLAN);
  const createValidation = useFormValidation(planSchema, createForm.values, { idPrefix: 'cp' });
  const editValidation = useFormValidation(planSchema, editForm.values, { idPrefix: 'ep' });

  const loadPlans = useCallback(async () => {
    setLoadState('loading');
    try {
      setPlans(await sa.getSubscriptionPlans());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const close = () => setModal(null);
  const open = (name, plan = null) => {
    setSelected(plan);
    setError('');
    setModal(name);
  };

  const openCompanies = async (p) => {
    setPlanCompanies(null);
    open('companies', p);
    try {
      setPlanCompanies(await sa.getCompaniesForPlan(p.plan_id));
    } catch {
      setPlanCompanies('error');
    }
  };

  const save = async (action, success, failure) => {
    const validation = action === 'create' ? createValidation : editValidation;
    setError('');
    if (!validation.validateAll()) return;
    const data = toPlanData(action === 'create' ? createForm.values : editForm.values);
    try {
      if (action === 'create') await sa.createSubscriptionPlan(data);
      else await sa.updateSubscriptionPlan(selected.plan_id, data);
      showToast(success);
      close();
      await loadPlans();
    } catch (e) {
      if (!validation.setServerErrors(e)) setError(e.message || failure);
    }
  };

  const submitStatus = async () => {
    try {
      await sa.updateSubscriptionPlanStatus(pendingStatus.id, pendingStatus.newStatus);
      showToast('Plan status updated successfully.');
      close();
      await loadPlans();
    } catch (e) {
      showToast(e.message || 'Failed to update status.', 'error');
    }
  };

  const verb = pendingStatus?.newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
  const footer = (label, onClick, variant = 'btn-primary') => (
    <>
      <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
      <button type="button" className={`btn ${variant}`} onClick={onClick}>{label}</button>
    </>
  );

  let rows;
  if (loadState === 'loading') rows = <StateRow colSpan={COLS} kind="loading">Loading plans...</StateRow>;
  else if (loadState === 'error') rows = <StateRow colSpan={COLS} kind="error">Failed to load subscription plans.</StateRow>;
  else if (plans.length === 0) rows = <StateRow colSpan={COLS} kind="empty" icon="ph-credit-card">No subscription plans yet.</StateRow>;
  else {
    rows = plans.map((p) => {
      const features = p.features || [];
      return (
        <tr key={p.plan_id}>
          <td>
            <div className="cell-primary">
              <span className="cell-name">{p.name}</span>
              <div className="plan-features">
                {features.slice(0, 3).map((f) => <span key={f} className="plan-feature-tag">{f}</span>)}
                {features.length > 3 && <span className="plan-feature-tag">+{features.length - 3} more</span>}
              </div>
            </div>
          </td>
          <td>{formatCurrency(p.price)}</td>
          <td>{p.billing_cycle === 'MONTHLY' ? 'Monthly' : 'Annual'}</td>
          <td><button type="button" className="pa-companies-chip" onClick={() => openCompanies(p)}><i className="ph ph-buildings"></i> {p.company_count}</button></td>
          <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{p.status}</span></td>
          <td>
            <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button" className="icon-btn" title="Edit"
                onClick={() => {
                  editForm.reset({ name: p.name, price: p.price, billing_cycle: p.billing_cycle, max_employees: p.max_employees || '', features: features.join(', ') });
                  open('edit', p);
                }}
              >
                <i className="ph ph-pencil-simple"></i>
              </button>
              {p.status === 'ACTIVE' ? (
                <button type="button" className="icon-btn danger" title="Deactivate" onClick={() => { setPendingStatus({ id: p.plan_id, name: p.name, newStatus: 'INACTIVE' }); open('status', p); }}><i className="ph ph-pause-circle"></i></button>
              ) : (
                <button type="button" className="icon-btn" title="Activate" onClick={() => { setPendingStatus({ id: p.plan_id, name: p.name, newStatus: 'ACTIVE' }); open('status', p); }}><i className="ph ph-check-circle"></i></button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  }

  let companiesBody;
  if (planCompanies === null) companiesBody = <div className="spinner"></div>;
  else if (planCompanies === 'error') companiesBody = <div className="error-state"><i className="ph ph-warning-circle"></i> Failed to load companies.</div>;
  else if (planCompanies.length === 0) companiesBody = <div className="empty-state"><i className="ph ph-buildings"></i> No companies are on this plan yet.</div>;
  else {
    companiesBody = planCompanies.map((c) => (
      <div key={c.company_id} className="company-list-item">
        <span>{c.company_name}</span>
        <span className={`badge ${companyStatusBadgeClass(c.status)}`}>{c.status}</span>
      </div>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Subscriptions" title="Subscriptions" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="section-header">
          <h2 className="section-title">Subscription Plans</h2>
          <button type="button" className="btn btn-primary" id="btn-open-create" onClick={() => { createForm.reset(); open('create'); }}><i className="ph ph-plus"></i> Create Plan</button>
        </div>

        <div className="card table-container">
          <table>
            <thead>
              <tr><th>Plan</th><th>Price</th><th>Billing Cycle</th><th>Companies</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody id="plans-tbody">{rows}</tbody>
          </table>
        </div>
      </div>

      <SaModal id="createPlanModal" open={modal === 'create'} onClose={close} title="Create Subscription Plan" footer={footer('Create Plan', () => save('create', 'Subscription plan created successfully.', 'Failed to create plan.'))}>
        <form id="create-plan-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <PlanFields form={createForm} prefix="cp" validation={createValidation} />
          <FormError id="create-plan-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="editPlanModal" open={modal === 'edit'} onClose={close} title="Edit Subscription Plan" footer={footer('Save Changes', () => save('edit', 'Plan updated successfully.', 'Failed to update plan.'))}>
        <form id="edit-plan-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <PlanFields form={editForm} prefix="ep" validation={editValidation} />
          <FormError id="edit-plan-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="planCompaniesModal" open={modal === 'companies'} onClose={close} titleId="plan-companies-title" title={`Companies on ${selected ? selected.name : 'Plan'}`}>
        {companiesBody}
      </SaModal>

      <SaModal
        id="statusConfirmModal" open={modal === 'status'} onClose={close} maxWidth="420px" titleId="status-confirm-title"
        title={`${verb.charAt(0).toUpperCase() + verb.slice(1)} Plan`} footer={footer('Confirm', submitStatus, 'btn-danger')}
      >
        <p id="status-confirm-text" style={{ color: 'var(--text-main)', margin: 0 }}>Are you sure you want to {verb} &quot;{pendingStatus?.name}&quot;?</p>
      </SaModal>

      {toast}
    </>
  );
}

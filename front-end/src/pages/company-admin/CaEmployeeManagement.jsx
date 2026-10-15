// Converted from front-end/company_admin/employee-management.html + js/views/company_admin/employee-management.js
import { useCallback, useEffect, useState } from 'react';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import SaModal from '../../components/sa-common/SaModal';
import { FormError, useFormState } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import * as ca from '../../services/companyAdminService';
import { departmentsOf, joinedThisMonth } from '../hr/hrUtils';
import { addEmployeeSchema, createTeamSchema, editEmployeeSchema, newAccountSchema } from '../../validation/formSchemas';
import { DEPARTMENTS } from './caConstants';
import '../hr/styles/employee-management.css';

const EMPTY_EMP = { name: '', email: '', phone: '', password: '', confirmPassword: '', department_id: '', team_id: '' };
const EMPTY_LEAD = { name: '', email: '', phone: '', password: '', confirmPassword: '' };
const inlineInput = { width: '100%', padding: 4, border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-surface)', color: 'var(--text-main)' };
const iconBtn = (color) => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 18 });

function Labeled({ label, htmlFor, required, error, children }) {
  return (
    <div className="form-group">
      <label htmlFor={htmlFor}>{label}{required && <RequiredMark />}</label>
      {children}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}

export default function CaEmployeeManagement() {
  usePageTitle('Employee Management');
  const [toast, showToast] = useSaToast();
  const [employees, setEmployees] = useState(null);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({ search: '', dept: 'all', status: 'all' });
  const [editing, setEditing] = useState(null); // { emp_id, ...draft }
  const [modal, setModal] = useState(null); // 'team' | 'lead'
  const [leadTeam, setLeadTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [modalError, setModalError] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const empForm = useFormState(EMPTY_EMP);
  const leadForm = useFormState(EMPTY_LEAD);
  const teamValidation = useFormValidation(createTeamSchema, { team_name: teamName }, { idPrefix: 'ct' });
  const leadValidation = useFormValidation(newAccountSchema, leadForm.values, { idPrefix: 'al' });

  const loadTeams = useCallback(async () => {
    try {
      setTeams(await ca.getTeams());
    } catch {
      setTeams([]);
      showToast('Failed to load teams.', 'error');
    }
  }, [showToast]);

  const loadEmployees = useCallback(async () => {
    try {
      setEmployees((await ca.getEmployees()).filter((e) => e.role === 'EMPLOYEE'));
    } catch {
      setEmployees([]);
      showToast('Failed to load employees.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadTeams();
    loadEmployees();
  }, [loadTeams, loadEmployees]);

  useEffect(() => {
    if (!addSuccess) return undefined;
    const timer = setTimeout(() => setAddSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [addSuccess]);

  const team = (id) => teams.find((t) => t.team_id === id);
  const teamsWithLead = teams.filter((t) => t.team_lead_id);
  const empValidation = useFormValidation(addEmployeeSchema(DEPARTMENTS, teamsWithLead.map((t) => t.team_id)), empForm.values, { idPrefix: 'addEmp' });
  const deptChoices = [...new Set([...DEPARTMENTS, ...(editing?.department_id ? [editing.department_id] : [])])];
  const editValidation = useFormValidation(editEmployeeSchema(deptChoices), editing || {}, { idPrefix: 'editEmp' });

  // ---- teams ----
  const submitTeam = async () => {
    setModalError('');
    if (!teamValidation.validateAll()) return;
    setSaving(true);
    try {
      await ca.createTeam({ team_name: teamName.trim() });
      showToast('Team created successfully.');
      setModal(null);
      await loadTeams();
    } catch (e) {
      if (!teamValidation.setServerErrors(e)) setModalError(e.message || 'Failed to create team.');
    } finally {
      setSaving(false);
    }
  };

  const submitLead = async () => {
    setModalError('');
    if (!leadValidation.validateAll()) return;
    const v = leadForm.values;
    const data = { ...v, name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() };
    setSaving(true);
    try {
      await ca.createTeamLead(leadTeam.team_id, data);
      showToast('Team Lead assigned successfully.');
      setModal(null);
      await loadTeams();
    } catch (e) {
      if (!leadValidation.setServerErrors(e)) setModalError(e.message || 'Failed to assign Team Lead.');
    } finally {
      setSaving(false);
    }
  };

  // ---- add employee ----
  const submitEmployee = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!empValidation.validateAll()) return;
    const v = empForm.values;
    const data = { ...v, name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() };
    setSaving(true);
    try {
      await ca.createEmployee(data);
      await Promise.all([loadEmployees(), loadTeams()]);
      empForm.reset();
      empValidation.reset();
      setAddSuccess(true);
    } catch (err) {
      if (!empValidation.setServerErrors(err)) setAddError(err.message || 'Failed to add employee.');
    } finally {
      setSaving(false);
    }
  };

  // ---- edit / delete ----
  const saveEdit = async () => {
    if (!editValidation.validateAll()) return;
    const { emp_id, ...draft } = editing;
    try {
      await ca.updateEmployee(emp_id, { ...draft, emp_name: draft.emp_name.trim(), email: draft.email.trim(), phone: draft.phone.trim() });
      showToast('Employee updated successfully.');
      setEditing(null);
      await loadEmployees();
    } catch (e) {
      if (!editValidation.setServerErrors(e)) showToast(e.message || 'Failed to update employee.', 'error');
    }
  };

  const remove = async (emp) => {
    if (!window.confirm(`Are you sure you want to delete employee ${emp.emp_id}?`)) return;
    try {
      await ca.deleteEmployee(emp.emp_id);
      showToast('Employee deleted successfully.');
      await Promise.all([loadEmployees(), loadTeams()]);
    } catch (e) {
      showToast(e.message || 'Failed to delete employee.', 'error');
    }
  };

  const all = employees || [];
  const term = filters.search.toLowerCase();
  const visible = all.filter((e) =>
    (!term || e.emp_name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term) || e.emp_id.toLowerCase().includes(term))
    && (filters.dept === 'all' || e.department_id === filters.dept)
    && (filters.status === 'all' || e.status === filters.status));
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const draft = (key) => ({
    value: editing?.[key] ?? '',
    onChange: (e) => setEditing((d) => ({ ...d, [key]: e.target.value })),
    onKeyDown: (e) => e.key === 'Enter' && saveEdit(),
    ...editValidation.input(key, `editEmp-${key}`),
  });
  const draftError = (key) => <FieldError {...editValidation.errorProps(key)} />;
  const modalFooter = (label, onClick) => (
    <><button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={onClick} disabled={saving}>{saving ? 'Saving...' : label}</button></>
  );
  const bindEmp = (key, id) => ({ ...empForm.bind(key), ...empValidation.input(key, id), 'aria-required': true });

  let rows;
  if (!employees) rows = <tr className="loader-row"><td colSpan={8}><div className="spinner"></div><div>Loading directory...</div></td></tr>;
  else if (visible.length === 0) rows = <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees found matching your criteria.</td></tr>;
  else {
    rows = visible.map((emp) => {
      const t = team(emp.team_id);
      if (editing?.emp_id === emp.emp_id) {
        return (
          <tr key={emp.emp_id}>
            <td>{emp.emp_id}</td>
            <td style={{ minWidth: 200 }}>
              <input type="text" aria-label="Name" placeholder="Name" maxLength={100} style={{ ...inlineInput, marginBottom: 4 }} {...draft('emp_name')} />
              {draftError('emp_name')}
              <input type="email" aria-label="Email" placeholder="Email" maxLength={254} style={{ ...inlineInput, marginBottom: 4, fontSize: 12 }} {...draft('email')} />
              {draftError('email')}
              <input type="tel" aria-label="Phone" placeholder="Phone" maxLength={20} style={{ ...inlineInput, fontSize: 12 }} {...draft('phone')} />
              {draftError('phone')}
            </td>
            <td style={{ minWidth: 160 }}>
              <select aria-label="Department" style={inlineInput} {...draft('department_id')}>
                {deptChoices.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {draftError('department_id')}
            </td>
            <td>{t?.team_name || '-'}</td>
            <td>{t?.team_lead_name || '-'}</td>
            <td>{emp.date_of_joining || '-'}</td>
            <td>
              <select aria-label="Status" style={inlineInput} {...draft('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              {draftError('status')}
            </td>
            <td style={{ textAlign: 'center' }}>
              <button type="button" title="Save" aria-label="Save" style={{ ...iconBtn('var(--emp-success)'), marginRight: 8 }} onClick={saveEdit}><i className="ph-bold ph-check"></i></button>
              <button type="button" title="Cancel" aria-label="Cancel" style={iconBtn('var(--emp-danger)')} onClick={() => setEditing(null)}><i className="ph-bold ph-x"></i></button>
            </td>
          </tr>
        );
      }
      return (
        <tr key={emp.emp_id}>
          <td><span className="emp-id-link">{emp.emp_id}</span></td>
          <td>
            <div className="emp-name-col">
              <span className="emp-name">{emp.emp_name}</span>
              <span className="emp-email" style={{ marginBottom: 2 }}>{emp.email}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><i className="ph ph-phone" style={{ verticalAlign: 'middle', marginRight: 2 }}></i> {emp.phone || 'N/A'}</span>
            </div>
          </td>
          <td>{emp.department_id || '-'}</td>
          <td>{t?.team_name || '-'}</td>
          <td>{t?.team_lead_name || '-'}</td>
          <td>{emp.date_of_joining || '-'}</td>
          <td><span className={`badge ${emp.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{emp.status}</span></td>
          <td style={{ textAlign: 'center' }}>
            <button
              type="button" className="btn-icon edit-btn" title="Edit Employee" aria-label="Edit employee" style={{ ...iconBtn('var(--emp-primary)'), marginRight: 8 }}
              onClick={() => { editValidation.reset(); setEditing({ emp_id: emp.emp_id, emp_name: emp.emp_name, email: emp.email, phone: emp.phone || '', department_id: emp.department_id || DEPARTMENTS[0], status: emp.status }); }}
            >
              <i className="ph ph-pencil-simple"></i>
            </button>
            <button type="button" className="btn-icon delete-btn" title="Delete Employee" aria-label="Delete employee" style={iconBtn('var(--emp-danger)')} onClick={() => remove(emp)}><i className="ph ph-trash"></i></button>
          </td>
        </tr>
      );
    });
  }

  return (
    <div className="hr-emp-manage">
      <div className="card add-emp-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ph-fill ph-users-three" style={{ color: 'var(--emp-primary)' }}></i> Teams &amp; Team Leads
          </div>
          <button type="button" className="btn-submit" id="btnOpenCreateTeam" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => { setTeamName(''); setModalError(''); teamValidation.reset(); setModal('team'); }}>
            <i className="ph ph-plus"></i> Create Team
          </button>
        </div>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
          <table>
            <thead><tr><th>Team</th><th>Team Lead</th><th>Employees</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody id="teamsTableBody">
              {teams.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No teams yet. Create one to get started.</td></tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.team_id}>
                    <td>{t.team_name}</td>
                    <td>{t.team_lead_name || <span className="badge inactive">Not assigned</span>}</td>
                    <td>{t.employee_count}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!t.team_lead_id && (
                        <button type="button" className="btn-icon edit-btn" title="Assign Team Lead" aria-label="Assign Team Lead" style={iconBtn('var(--emp-primary)')} onClick={() => { leadForm.reset(); leadValidation.reset(); setLeadTeam(t); setModalError(''); setModal('lead'); }}>
                          <i className="ph ph-user-plus"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card add-emp-card">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ph-fill ph-user-plus" style={{ color: 'var(--emp-primary)' }}></i> Add New Employee
        </div>
        <form id="addEmpForm" onSubmit={submitEmployee} noValidate>
          <div className="form-grid">
            <Labeled label="Full Name" htmlFor="addEmpName" required error={empValidation.errors.name}><input type="text" maxLength={100} placeholder="e.g. Jane Doe" {...bindEmp('name', 'addEmpName')} /></Labeled>
            <Labeled label="Email Address" htmlFor="addEmpEmail" required error={empValidation.errors.email}><input type="email" maxLength={254} placeholder="jane@company.com" {...bindEmp('email', 'addEmpEmail')} /></Labeled>
            <Labeled label="Phone Number" htmlFor="addEmpPhone" required error={empValidation.errors.phone}><input type="tel" maxLength={20} placeholder="e.g. +91 98765 43210" {...bindEmp('phone', 'addEmpPhone')} /></Labeled>
            <Labeled label="Password" htmlFor="addEmpPassword" required error={empValidation.errors.password}><input type="password" maxLength={64} autoComplete="new-password" {...bindEmp('password', 'addEmpPassword')} /></Labeled>
            <Labeled label="Confirm Password" htmlFor="addEmpConfirmPassword" required error={empValidation.errors.confirmPassword}><input type="password" maxLength={64} autoComplete="new-password" {...bindEmp('confirmPassword', 'addEmpConfirmPassword')} /></Labeled>
            <Labeled label="Department" htmlFor="addEmpDept" required error={empValidation.errors.department_id}>
              <select {...bindEmp('department_id', 'addEmpDept')}>
                <option value="" disabled>Select Dept</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Labeled>
            <Labeled label="Team" htmlFor="addEmpTeam" required error={empValidation.errors.team_id}>
              <select {...bindEmp('team_id', 'addEmpTeam')}>
                <option value="" disabled>{teamsWithLead.length ? 'Select Team' : 'No teams with a Team Lead yet'}</option>
                {teamsWithLead.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
              </select>
            </Labeled>
            <Labeled label="Team Lead" htmlFor="addEmpTeamLead">
              <input type="text" id="addEmpTeamLead" readOnly placeholder="Select a team first" value={team(empForm.values.team_id)?.team_lead_name || ''} style={{ background: 'var(--bg-hover, #f3f4f6)' }} />
            </Labeled>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn-submit" id="addEmpSubmitBtn" disabled={saving}>{saving ? 'Adding...' : 'Add Employee'}</button>
          </div>
          {addError && <div id="addEmpError" className="form-error" style={{ display: 'block', marginTop: 12 }} role="alert">{addError}</div>}
          {addSuccess && (
            <div id="addEmpSuccess" style={{ color: 'var(--emp-success)', fontSize: 13, fontWeight: 500, marginTop: 12 }} role="status">
              <i className="ph-fill ph-check-circle"></i> Employee successfully added!
            </div>
          )}
        </form>
      </div>

      <div className="card filter-bar">
        <div className="search-wrap">
          <i className="ph ph-magnifying-glass"></i>
          <input type="text" maxLength={100} id="empSearch" className="search-input" placeholder="Search employees by name, email, or ID..." aria-label="Search employees" value={filters.search} onChange={setFilter('search')} />
        </div>
        <div className="filters-wrap">
          <select id="empDeptFilter" className="filter-select" aria-label="Filter by department" value={filters.dept} onChange={setFilter('dept')}>
            <option value="all">All Departments</option>
            {departmentsOf(all).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select id="empStatusFilter" className="filter-select" aria-label="Filter by status" value={filters.status} onChange={setFilter('status')}>
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="button" className="btn-clear" id="empClearSort" onClick={() => setFilters({ search: '', dept: 'all', status: 'all' })}><i className="ph ph-x"></i> Clear</button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr><th>Employee ID</th><th>Employee</th><th>Department</th><th>Team</th><th>Team Lead</th><th>Join Date</th><th>Status</th><th style={{ width: 80, textAlign: 'center' }}>Actions</th></tr>
          </thead>
          <tbody id="empTableBody">{rows}</tbody>
        </table>
      </div>

      <div className="summary-grid">
        <div className="card summary-card sc-total"><div className="sc-val"><AnimatedCount value={all.length} /></div><div className="sc-label">Total Employees</div></div>
        <div className="card summary-card sc-active"><div className="sc-val"><AnimatedCount value={all.filter((e) => e.status === 'ACTIVE').length} /></div><div className="sc-label">Active</div></div>
        <div className="card summary-card sc-leave"><div className="sc-val"><AnimatedCount value={all.filter((e) => e.status !== 'ACTIVE').length} /></div><div className="sc-label">Inactive</div></div>
        <div className="card summary-card sc-new"><div className="sc-val"><AnimatedCount value={all.filter((e) => joinedThisMonth(e)).length} /></div><div className="sc-label">New This Month</div></div>
      </div>

      <SaModal id="createTeamModal" open={modal === 'team'} onClose={() => setModal(null)} title="Create Team" footer={modalFooter('Create Team', submitTeam)}>
        <form id="createTeamForm" onSubmit={(e) => { e.preventDefault(); submitTeam(); }} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="ct-name">Team Name<RequiredMark /></label>
            <input type="text" className="form-control" aria-required="true" maxLength={60} value={teamName} onChange={(e) => setTeamName(e.target.value)} {...teamValidation.input('team_name', 'ct-name')} />
            <FieldError {...teamValidation.errorProps('team_name')} />
          </div>
          <FormError id="createTeamError" message={modalError} />
        </form>
      </SaModal>

      <SaModal id="assignLeadModal" open={modal === 'lead'} onClose={() => setModal(null)} title={`Assign Team Lead${leadTeam ? ` - ${leadTeam.team_name}` : ''}`} footer={modalFooter('Assign Team Lead', submitLead)}>
        <form id="assignLeadForm" onSubmit={(e) => { e.preventDefault(); submitLead(); }} noValidate>
          {[['name', 'Full Name', 'text', 100], ['email', 'Email', 'email', 254], ['phone', 'Phone', 'tel', 20], ['password', 'Password', 'password', 64], ['confirmPassword', 'Confirm Password', 'password', 64]].map(([key, label, type, max]) => (
            <div key={key} className="form-group">
              <label className="form-label" htmlFor={`al-${key}`}>{label}<RequiredMark /></label>
              <input type={type} className="form-control" aria-required="true" maxLength={max} autoComplete={type === 'password' ? 'new-password' : undefined} {...leadForm.bind(key)} {...leadValidation.input(key, `al-${key}`)} />
              <FieldError {...leadValidation.errorProps(key)} />
            </div>
          ))}
          <FormError id="assignLeadError" message={modalError} />
        </form>
      </SaModal>

      {toast}
    </div>
  );
}

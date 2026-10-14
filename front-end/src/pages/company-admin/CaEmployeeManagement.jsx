// Converted from front-end/company_admin/employee-management.html + js/views/company_admin/employee-management.js
import { useCallback, useEffect, useState } from 'react';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import SaModal from '../../components/sa-common/SaModal';
import { FormError, useFormState } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import usePageTitle from '../../hooks/usePageTitle';
import * as ca from '../../services/companyAdminService';
import { departmentsOf, joinedThisMonth } from '../hr/hrUtils';
import { DEPARTMENTS, EMAIL_RE, PHONE_RE, STRONG_PASSWORD } from './caConstants';
import '../hr/styles/employee-management.css';

const EMPTY_EMP = { name: '', email: '', phone: '', password: '', confirmPassword: '', department_id: '', team_id: '' };
const EMPTY_LEAD = { name: '', email: '', phone: '', password: '', confirmPassword: '' };
const inlineInput = { width: '100%', padding: 4, border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-surface)', color: 'var(--text-main)' };
const iconBtn = (color) => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 18 });

function Labeled({ label, htmlFor, children }) {
  return <div className="form-group"><label htmlFor={htmlFor}>{label}</label>{children}</div>;
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
  const empForm = useFormState(EMPTY_EMP);
  const leadForm = useFormState(EMPTY_LEAD);

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

  // ---- teams ----
  const submitTeam = async () => {
    if (!teamName.trim()) return setModalError('Please enter a team name.');
    try {
      await ca.createTeam({ team_name: teamName.trim() });
      showToast('Team created successfully.');
      setModal(null);
      await loadTeams();
    } catch (e) {
      setModalError(e.message || 'Failed to create team.');
    }
  };

  const submitLead = async () => {
    const v = leadForm.values;
    const data = { ...v, name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() };
    if (!data.name || !data.email || !data.phone || !data.password || !data.confirmPassword) return setModalError('All fields are required.');
    if (!EMAIL_RE.test(data.email)) return setModalError('Please enter a valid email address.');
    if (!STRONG_PASSWORD.test(data.password)) return setModalError('Password must be 8+ characters with uppercase, lowercase, a number, and a special character.');
    if (data.password !== data.confirmPassword) return setModalError('Passwords do not match.');
    try {
      await ca.createTeamLead(leadTeam.team_id, data);
      showToast('Team Lead assigned successfully.');
      setModal(null);
      await loadTeams();
    } catch (e) {
      setModalError(e.message || 'Failed to assign Team Lead.');
    }
  };

  // ---- add employee ----
  const submitEmployee = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    const v = empForm.values;
    const data = { ...v, name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() };
    if (!EMAIL_RE.test(data.email)) return setAddError('Please enter a valid email address.');
    if (!PHONE_RE.test(data.phone)) return setAddError('Please enter a valid phone number.');
    if (!STRONG_PASSWORD.test(data.password)) return setAddError('Password must be 8+ characters with uppercase, lowercase, a number, and a special character.');
    if (data.password !== data.confirmPassword) return setAddError('Passwords do not match.');
    if (!data.team_id) return setAddError('Please select a team.');
    try {
      await ca.createEmployee(data);
      await Promise.all([loadEmployees(), loadTeams()]);
      empForm.reset();
      setAddSuccess(true);
    } catch (err) {
      setAddError(err.message || 'Failed to add employee.');
    }
  };

  // ---- edit / delete ----
  const saveEdit = async () => {
    const { emp_id, ...draft } = editing;
    try {
      await ca.updateEmployee(emp_id, { ...draft, emp_name: draft.emp_name.trim(), email: draft.email.trim(), phone: draft.phone.trim() });
      showToast('Employee updated successfully.');
      setEditing(null);
      await loadEmployees();
    } catch (e) {
      showToast(e.message || 'Failed to update employee.', 'error');
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
  const draft = (key) => ({ value: editing?.[key] ?? '', onChange: (e) => setEditing((d) => ({ ...d, [key]: e.target.value })) });
  const deptOptions = (current) => [...new Set([...DEPARTMENTS, ...(current ? [current] : [])])];
  const modalFooter = (label, onClick) => (
    <><button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={onClick}>{label}</button></>
  );

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
              <input type="text" aria-label="Name" placeholder="Name" style={{ ...inlineInput, marginBottom: 4 }} {...draft('emp_name')} />
              <input type="email" aria-label="Email" placeholder="Email" style={{ ...inlineInput, marginBottom: 4, fontSize: 12 }} {...draft('email')} />
              <input type="text" aria-label="Phone" placeholder="Phone" style={{ ...inlineInput, fontSize: 12 }} {...draft('phone')} />
            </td>
            <td style={{ minWidth: 160 }}>
              <select aria-label="Department" style={inlineInput} {...draft('department_id')}>
                {deptOptions(emp.department_id).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </td>
            <td>{t?.team_name || '-'}</td>
            <td>{t?.team_lead_name || '-'}</td>
            <td>{emp.date_of_joining || '-'}</td>
            <td>
              <select aria-label="Status" style={inlineInput} {...draft('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
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
              onClick={() => setEditing({ emp_id: emp.emp_id, emp_name: emp.emp_name, email: emp.email, phone: emp.phone || '', department_id: emp.department_id || DEPARTMENTS[0], status: emp.status })}
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
          <button type="button" className="btn-submit" id="btnOpenCreateTeam" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => { setTeamName(''); setModalError(''); setModal('team'); }}>
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
                        <button type="button" className="btn-icon edit-btn" title="Assign Team Lead" aria-label="Assign Team Lead" style={iconBtn('var(--emp-primary)')} onClick={() => { leadForm.reset(); setLeadTeam(t); setModalError(''); setModal('lead'); }}>
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
        <form id="addEmpForm" onSubmit={submitEmployee}>
          <div className="form-grid">
            <Labeled label="Full Name" htmlFor="addEmpName"><input type="text" id="addEmpName" required placeholder="e.g. Jane Doe" {...empForm.bind('name')} /></Labeled>
            <Labeled label="Email Address" htmlFor="addEmpEmail"><input type="email" id="addEmpEmail" required placeholder="jane@company.com" {...empForm.bind('email')} /></Labeled>
            <Labeled label="Phone Number" htmlFor="addEmpPhone"><input type="text" id="addEmpPhone" required placeholder="e.g. 9000000000" {...empForm.bind('phone')} /></Labeled>
            <Labeled label="Password" htmlFor="addEmpPassword"><input type="password" id="addEmpPassword" required autoComplete="new-password" {...empForm.bind('password')} /></Labeled>
            <Labeled label="Confirm Password" htmlFor="addEmpConfirmPassword"><input type="password" id="addEmpConfirmPassword" required autoComplete="new-password" {...empForm.bind('confirmPassword')} /></Labeled>
            <Labeled label="Department" htmlFor="addEmpDept">
              <select id="addEmpDept" required {...empForm.bind('department_id')}>
                <option value="" disabled>Select Dept</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Labeled>
            <Labeled label="Team" htmlFor="addEmpTeam">
              <select id="addEmpTeam" required {...empForm.bind('team_id')}>
                <option value="" disabled>{teamsWithLead.length ? 'Select Team' : 'No teams with a Team Lead yet'}</option>
                {teamsWithLead.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
              </select>
            </Labeled>
            <Labeled label="Team Lead" htmlFor="addEmpTeamLead">
              <input type="text" id="addEmpTeamLead" readOnly placeholder="Select a team first" value={team(empForm.values.team_id)?.team_lead_name || ''} style={{ background: 'var(--bg-hover, #f3f4f6)' }} />
            </Labeled>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn-submit" id="addEmpSubmitBtn">Add Employee</button>
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
          <input type="text" id="empSearch" className="search-input" placeholder="Search employees by name, email, or ID..." aria-label="Search employees" value={filters.search} onChange={setFilter('search')} />
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
        <form id="createTeamForm" onSubmit={(e) => { e.preventDefault(); submitTeam(); }}>
          <div className="form-group">
            <label className="form-label" htmlFor="ct-name">Team Name</label>
            <input type="text" className="form-control" id="ct-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <FormError id="createTeamError" message={modalError} />
        </form>
      </SaModal>

      <SaModal id="assignLeadModal" open={modal === 'lead'} onClose={() => setModal(null)} title={`Assign Team Lead${leadTeam ? ` - ${leadTeam.team_name}` : ''}`} footer={modalFooter('Assign Team Lead', submitLead)}>
        <form id="assignLeadForm" onSubmit={(e) => e.preventDefault()}>
          {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['password', 'Password', 'password'], ['confirmPassword', 'Confirm Password', 'password']].map(([key, label, type]) => (
            <div key={key} className="form-group">
              <label className="form-label" htmlFor={`al-${key}`}>{label}</label>
              <input type={type} className="form-control" id={`al-${key}`} autoComplete={type === 'password' ? 'new-password' : undefined} {...leadForm.bind(key)} />
            </div>
          ))}
          <FormError id="assignLeadError" message={modalError} />
        </form>
      </SaModal>

      {toast}
    </div>
  );
}

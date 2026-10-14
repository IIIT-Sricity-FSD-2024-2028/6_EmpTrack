// Converted from front-end/company_admin/raise-issue.html + js/views/company_admin/raise-issue.js
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { raiseCompanyIssue } from '../../services/companyAdminService';
import { CA_BASE } from './caConstants';

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High', danger: true },
  { value: 'CRITICAL', label: 'Critical', danger: true },
];

const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };

export default function CaRaiseIssue() {
  usePageTitle('Raise Issue');
  const navigate = useNavigate();
  const [form, setForm] = useState({ priority: 'MEDIUM', category: '', title: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await raiseCompanyIssue({ title: form.title, description: form.description, priority: form.priority, category: form.category || undefined });
      navigate(`${CA_BASE}/dashboard`);
    } catch (err) {
      setError(err.message || 'Could not raise issue. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 24 }}>
        <Link to={`${CA_BASE}/dashboard`} style={{ color: 'var(--text-main)', textDecoration: 'none' }} aria-label="Back to dashboard"><i className="ph ph-arrow-left" style={{ fontSize: 20 }}></i></Link>
        <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)' }}>Raise an Issue</div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ backgroundColor: 'var(--primary-light)', borderRadius: 12, padding: 24, marginBottom: 24, display: 'flex', gap: 16 }}>
          <div style={{ color: 'var(--primary-color)', fontSize: 24 }}><i className="ph ph-info"></i></div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--primary-hover)', fontSize: 'var(--text-md)' }}>Goes straight to your Platform Admin</h4>
            <p style={{ margin: 0, color: 'var(--text-main)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>Use this for technical problems, bugs, or platform issues affecting your company. They&apos;ll be notified immediately.</p>
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>Issue Details</h3>

          <form id="raise-company-issue-form" onSubmit={submit}>
            <div style={{ marginBottom: 24 }}>
              <span className="form-label" style={{ fontWeight: 'var(--font-medium)' }}>Priority Level</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} id="priority-grid" role="radiogroup" aria-label="Priority Level">
                {PRIORITIES.map((p) => (
                  <div
                    key={p.value} role="radio" aria-checked={form.priority === p.value} tabIndex={0}
                    className={`radio-card${form.priority === p.value ? ' selected' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                    onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setForm((f) => ({ ...f, priority: p.value }))}
                  >
                    <div style={{ fontWeight: 'bold', color: p.danger ? 'var(--danger-color)' : undefined }}>{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="category" style={{ fontWeight: 'var(--font-medium)' }}>Category</label>
              <input type="text" id="category" className="form-control" placeholder="e.g. Billing, Bug, Integration" style={fieldStyle} value={form.category} onChange={set('category')} />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="title" style={{ fontWeight: 'var(--font-medium)' }}>Issue Title</label>
              <input type="text" id="title" className="form-control" required placeholder="Brief summary of the issue" style={fieldStyle} value={form.title} onChange={set('title')} />
            </div>

            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label" htmlFor="description" style={{ fontWeight: 'var(--font-medium)' }}>Detailed Description</label>
              <textarea id="description" className="form-control" required rows={5} placeholder="What's happening, and what have you tried?" style={{ ...fieldStyle, padding: 16, resize: 'vertical' }} value={form.description} onChange={set('description')}></textarea>
            </div>

            {error && <div id="raise-issue-error" role="alert" style={{ color: 'var(--danger-color)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '14px 32px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--text-md)' }}>
                Raise Issue to Platform Admin <i className="ph ph-paper-plane-right"></i>
              </button>
              <button type="button" className="btn btn-outline" style={{ padding: '12px 32px' }} onClick={() => navigate(`${CA_BASE}/dashboard`)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

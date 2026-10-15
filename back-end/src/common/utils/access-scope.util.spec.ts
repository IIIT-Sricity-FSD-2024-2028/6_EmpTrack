import { canAccessEmployee, isDateKey } from './access-scope.util';

describe('isDateKey', () => {
  it.each(['2026-01-01', '2024-02-29', '2026-12-31'])('accepts %s', (d) => expect(isDateKey(d)).toBe(true));
  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '26-01-01', '2026-1-1', '', 'tomorrow'])('rejects %s', (d) =>
    expect(isDateKey(d)).toBe(false));
  it('rejects non-strings', () => expect(isDateKey(undefined as any)).toBe(false));
});

describe('canAccessEmployee', () => {
  const emp = { emp_id: 'E1', role: 'EMPLOYEE', companyId: 'C1', manager_id: 'TL1' };
  const peer = { emp_id: 'E2', role: 'EMPLOYEE', companyId: 'C1', manager_id: 'TL1' };
  const tl = { emp_id: 'TL1', role: 'TEAMLEAD', companyId: 'C1' };
  const otherTl = { emp_id: 'TL9', role: 'TEAMLEAD', companyId: 'C1' };
  const hr = { emp_id: 'H1', role: 'HR', companyId: 'C1' };
  const foreignHr = { emp_id: 'H2', role: 'HR', companyId: 'C2' };
  const admin = { emp_id: 'A1', role: 'COMPANY_ADMIN', companyId: 'C1' };
  const superAdmin = { emp_id: 'S1', role: 'SUPER_ADMIN', companyId: null };
  const platformAdmin = { emp_id: 'P1', role: 'PLATFORM_ADMIN', companyId: null };

  it('allows self', () => expect(canAccessEmployee(emp, emp)).toBe(true));
  it('blocks a peer employee', () => expect(canAccessEmployee(emp, peer)).toBe(false));
  it("allows the employee's own Team Lead", () => expect(canAccessEmployee(tl, emp)).toBe(true));
  it('blocks another Team Lead in the same company', () => expect(canAccessEmployee(otherTl, emp)).toBe(false));
  it('allows HR and Company Admin of the same company', () => {
    expect(canAccessEmployee(hr, emp)).toBe(true);
    expect(canAccessEmployee(admin, emp)).toBe(true);
  });
  it('blocks HR of another company', () => expect(canAccessEmployee(foreignHr, emp)).toBe(false));
  it('allows Super Admin, not Platform Admin', () => {
    expect(canAccessEmployee(superAdmin, emp)).toBe(true);
    expect(canAccessEmployee(platformAdmin, emp)).toBe(false);
  });
  it('blocks a missing target', () => expect(canAccessEmployee(hr, undefined)).toBe(false));
  it('never matches two company-less accounts by companyId', () =>
    expect(canAccessEmployee({ ...platformAdmin, role: 'HR' }, { emp_id: 'X', companyId: null })).toBe(false));
});

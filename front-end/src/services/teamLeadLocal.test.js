// Team Lead browser-only data (profile edits, reports, drafts, escalation history)
// must belong to the Team Lead who saved it, not to whoever uses the browser next.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import {
  clearEscalationDraft, escalateToHr, getEscalationDraft, getProfileEdits, getReports, saveEscalationDraft, saveProfile, saveReport,
} from './teamLeadService';
import { STORAGE_KEYS } from '../utils/constants';

vi.mock('../config/config', () => ({ default: { apiUrl: 'http://api.test' } }));
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('./employeeService', () => ({ getUserById: vi.fn(), updateUserPassword: vi.fn() }));

const ACCOUNTS = {
  TL001: { emp_id: 'TL001', emp_name: 'Rinku', role: 'TEAMLEAD', phone: '1111111111', email: 'tl1@acme.test' },
  TL002: { emp_id: 'TL002', emp_name: 'Priya', role: 'TEAMLEAD', phone: '2222222222', email: 'tl2@acme.test' },
};
const signIn = (empId) => localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ user: { emp_id: empId, role: 'TEAMLEAD' }, token: `t-${empId}` }));
const signOut = () => localStorage.removeItem(STORAGE_KEYS.AUTH);
// The browser-only layer of each Team Lead's profile (the account itself comes from Redux).
const profileOf = (empId) => getProfileEdits(ACCOUNTS[empId]);

beforeEach(() => {
  localStorage.clear();
  api.post.mockImplementation(async () => ({ escalation_id: 'ESC-1', status: 'OPEN', escalation_date: '2026-11-25' }));
});
afterEach(() => vi.clearAllMocks());

async function teamLeadASavesEverything() {
  signIn('TL001');
  await saveProfile({ phone: '9999999999', address: '12 Lake Road', experience: '8 years', skills: ['React'] });
  await saveReport({ type: 'Attendance', title: 'Attendance - This Month', format: 'csv' });
  await saveEscalationDraft({ title: 'Repeated absences', category: 'ATTENDANCE' });
  await escalateToHr({ category: 'ATTENDANCE', title: 'Repeated absences', description: 'Five absences this month.' }, 'TL001');
}

describe('Team Lead browser data is per employee', () => {
  it("Team Lead B on the same browser sees none of A's profile edits, reports, drafts or history", async () => {
    await teamLeadASavesEverything();
    signIn('TL002');

    expect(profileOf('TL002')).toEqual({}); // none of A's edits
    expect(await getReports()).toEqual([]);
    expect(getEscalationDraft()).toBeNull();
    // A's escalation history copy is stored under A's key only.
    expect(localStorage.getItem('empTrack_tl_local_TL001')).toContain('Repeated absences');
    expect(localStorage.getItem('empTrack_tl_local_TL002')).toBeNull();
  });

  it('B saves their own data, and A still finds exactly theirs afterwards', async () => {
    await teamLeadASavesEverything();
    signIn('TL002');
    await saveProfile({ address: '7 Hill Street' });
    await saveReport({ type: 'Tasks', title: 'Tasks - This Week', format: 'pdf' });
    expect(profileOf('TL002')).toEqual({ address: '7 Hill Street' });
    expect((await getReports()).map((r) => r.title)).toEqual(['Tasks - This Week']);

    signIn('TL001');
    expect(profileOf('TL001')).toEqual({ phone: '9999999999', address: '12 Lake Road', experience: '8 years', skills: ['React'] });
    expect((await getReports()).map((r) => r.title)).toEqual(['Attendance - This Month']);
    expect(getEscalationDraft()).toMatchObject({ title: 'Repeated absences' });
    clearEscalationDraft();
    expect(getEscalationDraft()).toBeNull();
  });
});

describe('without a signed-in employee', () => {
  it('reads nothing, writes nothing, and never falls back to the old shared key', async () => {
    // Data left under the pre-fix shared key (could belong to any Team Lead).
    localStorage.setItem('empTrack_tl_local', JSON.stringify({ reports: [{ id: 'RPT-001', title: 'Old shared report' }], profile: { phone: '0000000000' } }));
    signOut();
    expect(await getReports()).toEqual([]);
    expect(getEscalationDraft()).toBeNull();
    await expect(saveReport({ title: 'x' })).rejects.toThrow();
    await expect(saveProfile({ phone: '1' })).rejects.toThrow();

    // Signed in again, nobody inherits the old shared data either.
    signIn('TL001');
    expect(await getReports()).toEqual([]);
    expect(profileOf('TL001')).toEqual({});
    expect(JSON.parse(localStorage.getItem('empTrack_tl_local')).reports).toHaveLength(1); // left untouched
  });
});

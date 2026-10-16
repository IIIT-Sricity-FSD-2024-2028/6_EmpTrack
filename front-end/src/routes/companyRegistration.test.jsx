// Company registration flow on the real route table: landing -> /company/register,
// step validation, document checks, and the status page. Backend calls are mocked
// at the service boundary; the backend's own rules are covered by its e2e suite.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import * as service from '../services/companyRegistrationService';
import { PATHS, STORAGE_KEYS } from '../utils/constants';

vi.mock('../config/config', () => ({
  default: { appName: 'EmpTrack', apiUrl: '', useMockAuth: true, sessionDuration: 8 * 60 * 60 * 1000 },
}));
vi.mock('../services/companyRegistrationService', async (importOriginal) => ({
  ...(await importOriginal()),
  startRegistration: vi.fn(),
  getRegistration: vi.fn(),
  uploadRegistrationDocument: vi.fn(),
  submitRegistration: vi.fn(),
}));

const REG = {
  reference: 'REG-ABC123',
  status: 'draft',
  company: { legal_name: 'Globex Pvt Ltd', business_type: 'PRIVATE_LIMITED', registration_number: 'U72200KA2015PTC123456', gstin: null, company_email: 'a@globex.com', phone: '9876543210', address: '12 MG Road, Bengaluru', country: 'India', state: 'Karnataka', website: null },
  documents: {},
  missing_documents: ['Certificate of Incorporation / registration document'],
  admin: null,
  rejection_reason: null,
  submitted_at: null,
};

async function openApp(path) {
  window.history.replaceState(null, '', path);
  render(<App />);
  await act(async () => {});
}
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('company registration', () => {
  it('opens from Get Started on the landing page', async () => {
    await openApp(PATHS.HOME);
    fireEvent.click(screen.getAllByRole('link', { name: /^Get Started/ })[0]);
    await screen.findByRole('heading', { name: 'Register your company' });
    expect(window.location.pathname).toBe(PATHS.COMPANY_REGISTER);
  });

  it('opens a fresh form from Get Started even when an old registration reference exists', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: 'REG-OLD', token: 'old-token' }));
    await openApp(PATHS.HOME);
    fireEvent.click(screen.getAllByRole('link', { name: /^Get Started/ })[0]);
    expect(await screen.findByRole('heading', { name: 'Register your company' })).toBeTruthy();
    expect(screen.getByLabelText(/Legal company name/).value).toBe('');
    expect(service.getRegistration).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATION))).toEqual({ reference: 'REG-OLD', token: 'old-token' });
  });

  it('returns home and opens a fresh form again without changing the saved reference', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: 'REG-OLD', token: 'old-token' }));
    await openApp(PATHS.HOME);
    fireEvent.click(screen.getAllByRole('link', { name: /^Get Started/ })[0]);
    fireEvent.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(await screen.findByRole('heading', { name: 'Smart Workforce Management for Growing Businesses' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('link', { name: /^Get Started/ })[0]);
    expect(await screen.findByLabelText(/Legal company name/)).toBeTruthy();
    expect(service.getRegistration).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATION)).reference).toBe('REG-OLD');
  });

  it('links between login, registration and home', async () => {
    await openApp(PATHS.LOGIN);
    expect(screen.getByRole('link', { name: 'Register your company' }).getAttribute('href')).toBe(PATHS.COMPANY_REGISTER);
    expect(screen.getByRole('link', { name: /Back to home/ }).getAttribute('href')).toBe(PATHS.HOME);
  });

  it('validates company details before saving, then moves to documents', async () => {
    await openApp(PATHS.COMPANY_REGISTER);
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(await screen.findByText('Legal company name is required.')).toBeTruthy();
    expect(service.startRegistration).not.toHaveBeenCalled();

    type(/Legal company name/, 'Globex Pvt Ltd');
    fireEvent.change(screen.getByLabelText(/Business type/), { target: { value: 'PRIVATE_LIMITED' } });
    type(/^CIN/, 'bad');
    type(/^State/, 'Karnataka');
    type(/Official business email/, 'a@globex.com');
    type(/Business phone number/, '9876543210');
    type(/Registered office address/, '12 MG Road, Bengaluru');
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(await screen.findByText(/CIN must be 21 characters/)).toBeTruthy();
    expect(service.startRegistration).not.toHaveBeenCalled();

    service.startRegistration.mockResolvedValue(REG);
    type(/^CIN/, 'u72200ka2015ptc123456');
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    await act(async () => {});
    expect(service.startRegistration).toHaveBeenCalledWith(expect.objectContaining({ registration_number: 'U72200KA2015PTC123456', country: 'India' }));
    expect(screen.getByLabelText(/Upload Certificate of Incorporation/)).toBeTruthy();
  });

  it('rejects disallowed files before uploading and blocks Continue until required documents exist', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: REG.reference, token: 't' }));
    service.getRegistration.mockResolvedValue(REG);
    await openApp(`${PATHS.COMPANY_REGISTER}?resume=1`);
    const input = document.getElementById('rg-doc-incorporation');
    fireEvent.change(input, { target: { files: [new File(['x'], 'cert.exe', { type: 'application/octet-stream' })] } });
    expect(await screen.findByText(/file type not allowed/)).toBeTruthy();
    expect(service.uploadRegistrationDocument).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/Please upload: Certificate of Incorporation/)).toBeTruthy();

    service.uploadRegistrationDocument.mockResolvedValue({
      ...REG,
      documents: { incorporation: { label: 'x', original_name: 'coi.pdf', size_bytes: 2048 } },
      missing_documents: [],
    });
    fireEvent.change(input, { target: { files: [new File(['%PDF-'], 'coi.pdf', { type: 'application/pdf' })] } });
    await act(async () => {});
    expect(screen.getByText(/coi\.pdf/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(/Administrator full name/)).toBeTruthy();
  });

  it('shows accessible administrator name and designation errors and preserves invalid values', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: REG.reference, token: 't' }));
    service.getRegistration.mockResolvedValue({
      ...REG,
      documents: { incorporation: { label: 'Certificate', original_name: 'coi.pdf', size_bytes: 2048 } },
      missing_documents: [],
    });
    await openApp(`${PATHS.COMPANY_REGISTER}?resume=1`);
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    const name = screen.getByLabelText(/Administrator full name/);
    const designation = screen.getByLabelText(/^Designation/);
    type(/Administrator full name/, 'administrator');
    fireEvent.blur(name);
    type(/^Designation/, '@@');
    fireEvent.blur(designation);

    expect(await screen.findByText("Administrator full name must be a person's name.")).toBeTruthy();
    expect(screen.getByText(/Designation must contain letters/)).toBeTruthy();
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(designation.getAttribute('aria-invalid')).toBe('true');
    for (const field of [name, designation]) {
      const errorId = field.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId).getAttribute('role')).toBe('alert');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Submit registration' }));
    expect(service.submitRegistration).not.toHaveBeenCalled();
    expect(name.value).toBe('administrator');
    expect(designation.value).toBe('@@');
  });

  it('submits registration, shows approval and provides a working login destination', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: REG.reference, token: 't' }));
    const draft = {
      ...REG,
      documents: { incorporation: { label: 'Certificate', original_name: 'coi.pdf', size_bytes: 2048 } },
      missing_documents: [],
    };
    const approved = {
      ...draft,
      status: 'verified',
      submitted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      admin: { name: 'अनन्या शर्मा', email: 'admin@globex.com', designation: 'Co-Founder & CEO' },
    };
    service.getRegistration.mockResolvedValueOnce(draft).mockResolvedValueOnce(approved);
    service.submitRegistration.mockResolvedValue(approved);
    await openApp(`${PATHS.COMPANY_REGISTER}?resume=1`);
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    type(/Administrator full name/, 'अनन्या शर्मा');
    type(/^Designation/, 'Co-Founder & CEO');
    type(/Official work email/, 'admin@globex.com');
    type(/^Password/, 'Valid@123');
    type(/Confirm password/, 'Valid@123');
    fireEvent.click(screen.getByLabelText(/I accept the Terms and Conditions/));
    fireEvent.click(screen.getByRole('button', { name: 'Submit registration' }));

    expect(await screen.findByRole('link', { name: 'Go to Login' })).toBeTruthy();
    expect(window.location.pathname).toBe(PATHS.REGISTRATION_STATUS);
    expect(service.submitRegistration).toHaveBeenCalledWith(expect.objectContaining({ admin_name: 'अनन्या शर्मा', designation: 'Co-Founder & CEO' }));
    expect(await screen.findByText('Your company is approved and your Company Admin account is ready. You can sign in now.')).toBeTruthy();
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Go to Login' }).getAttribute('href')).toBe(PATHS.LOGIN);
    expect(screen.queryByText(/cannot sign in until the review/i)).toBeNull();
  });

  it('refreshes the status page against the saved registration and displays the backend status', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: REG.reference, token: 't' }));
    const approved = { ...REG, status: 'verified', reviewed_at: new Date().toISOString(), documents: {}, admin: null };
    service.getRegistration.mockResolvedValue(approved);
    await openApp(PATHS.REGISTRATION_STATUS);
    expect((await screen.findAllByText('Approved')).length).toBeGreaterThan(0);
    expect(service.getRegistration).toHaveBeenCalledTimes(1);
    cleanup();
    await openApp(PATHS.REGISTRATION_STATUS);
    expect((await screen.findAllByText('Approved')).length).toBeGreaterThan(0);
    expect(service.getRegistration).toHaveBeenCalledTimes(2);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATION))).toEqual({ reference: REG.reference, token: 't' });
  });

  it('shows the rejection reason with a resubmit option', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: REG.reference, token: 't' }));
    service.getRegistration.mockResolvedValue({ ...REG, status: 'rejected', rejection_reason: 'Certificate is unreadable.' });
    await openApp(PATHS.REGISTRATION_STATUS);
    expect(screen.getByText('Certificate is unreadable.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Update and resubmit' }).getAttribute('href')).toBe(`${PATHS.COMPANY_REGISTER}?resume=1`);
  });

  it('keeps the saved reference if the server no longer recognises it', async () => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify({ reference: 'REG-GONE', token: 't' }));
    service.getRegistration.mockRejectedValue(Object.assign(new Error('nope'), { status: 403 }));
    await openApp(PATHS.REGISTRATION_STATUS);
    expect(screen.getByText('No company registration was found in this browser.')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATION))).toEqual({ reference: 'REG-GONE', token: 't' });
  });
});

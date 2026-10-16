// Company self-registration (public; see back-end/src/company-registration).
// Applicants have no login, so each request carries the registration's own access
// token, returned once when the registration is started and kept in localStorage
// with its reference so a refresh (or the status page) can pick it up again.
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';

export const getSavedRegistration = () => readStorage(STORAGE_KEYS.REGISTRATION);
export const forgetRegistration = () => writeStorage(STORAGE_KEYS.REGISTRATION, null);

function saved() {
  const s = getSavedRegistration();
  if (!s?.reference || !s?.token) throw new Error('No company registration was found in this browser.');
  return { base: `/company-registrations/${encodeURIComponent(s.reference)}`, headers: { 'X-Registration-Token': s.token } };
}

/** Step 1, first save: creates the draft and remembers its reference + token. */
export async function startRegistration(details) {
  const { registration, token } = await api.post('/company-registrations', details);
  writeStorage(STORAGE_KEYS.REGISTRATION, { reference: registration.reference, token });
  return registration;
}

export function getRegistration() {
  const { base, headers } = saved();
  return api.get(base, { headers });
}

export function updateRegistration(details) {
  const { base, headers } = saved();
  return api.patch(base, details, { headers });
}

export function uploadRegistrationDocument(docType, file) {
  const { base, headers } = saved();
  const form = new FormData();
  form.append('file', file);
  return api.post(`${base}/documents/${docType}`, form, { headers });
}

export function submitRegistration(admin) {
  const { base, headers } = saved();
  return api.post(`${base}/submit`, admin, { headers });
}

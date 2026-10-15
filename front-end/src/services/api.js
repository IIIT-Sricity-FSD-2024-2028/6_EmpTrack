// Thin wrapper around native fetch for all backend requests.
// Usage: api.get('/employees', { params: { status: 'active' } })
//        api.post('/tasks', { title: '...' })
//
// Requests carry the session token from POST /auth/login as
// `Authorization: Bearer <token>`. The backend resolves the caller's identity
// and role from that token alone (back-end/src/common/guards/auth.guard.ts);
// it ignores any Role / x-actor-* headers a client sends.
import config from '../config/config';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../utils/helpers';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // { field: [messages] } from a 400 validation response (see the backend's
    // createValidationPipe); forms show these next to the matching fields.
    this.fieldErrors = data && typeof data === 'object' && data.errors ? data.errors : null;
  }
}

function buildUrl(path, params) {
  const url = `${config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ).toString();
  return query ? `${url}?${query}` : url;
}

// Fired when the backend rejects the stored session (expired, revoked, account
// deactivated); AuthContext listens for it and logs the user out.
export const SESSION_EXPIRED_EVENT = 'emptrack:session-expired';

function sessionToken() {
  return readStorage(STORAGE_KEYS.AUTH)?.token || null;
}

async function request(method, path, { body, params, headers, signal } = {}) {
  if (!config.apiUrl) {
    throw new ApiError('VITE_API_URL is not configured.', 0);
  }

  const isFormData = body instanceof FormData;
  const token = sessionToken();

  const response = await fetch(buildUrl(path, params), {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (response.status === 401 && token) {
    writeStorage(STORAGE_KEYS.AUTH, null);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!response.ok) {
    const message = (data && data.message) || response.statusText || 'API request failed';
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status, data);
  }
  return data;
}

const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};

export default api;

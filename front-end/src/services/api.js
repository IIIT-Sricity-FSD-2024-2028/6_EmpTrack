// Thin wrapper around native fetch for all backend requests.
// Usage: api.get('/employees', { params: { status: 'active' } })
//        api.post('/tasks', { title: '...' })
//
// The backend authorizes requests by the `Role`, `x-actor-id` and
// `x-actor-name` headers (see back-end/src/common/guards/roles.guard.ts),
// which are filled in from the logged-in user's session.
import config from '../config/config';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage } from '../utils/helpers';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
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

function sessionHeaders() {
  const session = readStorage(STORAGE_KEYS.AUTH);
  const user = session?.user;
  const headers = {};
  if (user) {
    headers.Role = user.role;
    headers['x-actor-id'] = user.emp_id || '';
    headers['x-actor-name'] = user.emp_name || '';
  }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  return headers;
}

async function request(method, path, { body, params, headers, signal } = {}) {
  if (!config.apiUrl) {
    throw new ApiError('VITE_API_URL is not configured.', 0);
  }

  const isFormData = body instanceof FormData;

  const response = await fetch(buildUrl(path, params), {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...sessionHeaders(),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

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

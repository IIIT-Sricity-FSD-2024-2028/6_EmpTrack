// Centralized application configuration.
// Environment values come from Vite (`import.meta.env`); see .env.example.

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const config = {
  appName: 'EmpTrack',
  apiUrl,
  env: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  // Until a backend URL is configured, authentication falls back to mock users.
  useMockAuth: !apiUrl,
  // How long a login session stays valid (ms).
  sessionDuration: 8 * 60 * 60 * 1000,
};

export default config;

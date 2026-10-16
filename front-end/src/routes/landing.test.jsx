// The public landing page at "/" on the real route table (routes.jsx), with the
// app's real providers. Config is pinned to "no backend" so auth uses the mock users
// even on a machine whose front-end/.env sets VITE_API_URL (Vitest loads .env too).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { PATHS, ROLES, STORAGE_KEYS } from '../utils/constants';

vi.mock('../config/config', () => ({
  default: { appName: 'EmpTrack', apiUrl: '', useMockAuth: true, sessionDuration: 8 * 60 * 60 * 1000 },
}));

async function openApp(path) {
  window.history.replaceState(null, '', path);
  render(<App />);
  await act(async () => {});
}

const landingHeading = () => screen.queryByRole('heading', { name: 'Smart Workforce Management for Growing Businesses' });
const loginHeading = () => screen.findByRole('heading', { name: 'Sign in to your account' });

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('landing page', () => {
  it('is shown at "/" instead of redirecting to /login', async () => {
    await openApp(PATHS.HOME);
    expect(landingHeading()).toBeTruthy();
    expect(window.location.pathname).toBe(PATHS.HOME);
  });

  it('links Login to /login and Get Started to company registration', async () => {
    await openApp(PATHS.HOME);
    const login = screen.getAllByRole('link', { name: /^Login$/ });
    const getStarted = screen.getAllByRole('link', { name: /^Get Started/ });
    expect(login.length).toBeGreaterThan(0);
    expect(getStarted.length).toBeGreaterThan(0);
    login.forEach((link) => expect(link.getAttribute('href')).toBe(PATHS.LOGIN));
    getStarted.forEach((link) => expect(link.getAttribute('href')).toBe(PATHS.COMPANY_REGISTER));

    fireEvent.click(screen.getAllByRole('link', { name: 'Login' })[0]);
    await loginHeading();
    expect(window.location.pathname).toBe(PATHS.LOGIN);
  });

  it('opens and closes FAQ answers', async () => {
    await openApp(PATHS.HOME);
    const question = screen.getByRole('button', { name: 'Is my data secure?' });
    const answer = document.getElementById(question.getAttribute('aria-controls'));
    expect(answer.hidden).toBe(true);
    fireEvent.click(question);
    expect(question.getAttribute('aria-expanded')).toBe('true');
    expect(answer.hidden).toBe(false);
    fireEvent.click(question);
    expect(answer.hidden).toBe(true);
  });

  it('leaves protected dashboards behind the login', async () => {
    for (const path of ['/employee/dashboard', '/teamlead/dashboard', '/hr/dashboard']) {
      await openApp(path);
      await loginHeading();
      expect(window.location.pathname).toBe(PATHS.LOGIN);
      cleanup();
    }
  });

  it('logs in from the landing page to the role dashboard', async () => {
    await openApp(PATHS.HOME);
    fireEvent.click(screen.getAllByRole('link', { name: 'Login' })[0]);
    await loginHeading();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'tl@emptrack.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Password@123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await act(async () => {});
    expect(window.location.pathname).toBe('/teamlead/dashboard');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).user.role).toBe(ROLES.TEAM_LEAD);
  });
});

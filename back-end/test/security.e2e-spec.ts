import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { createValidationPipe } from './../src/common/validation/validators';
import { SessionService } from './../src/auth/session.service';

// End-to-end checks for authentication, authorization/tenant isolation and the core
// business rules (leave, attendance, tasks, issues, notifications, escalations).
// Runs against the real AppModule and its in-memory seed data; tests in a describe
// block share one app instance and run in order.

const PASSWORD = 'Password@123';
const DAY_MS = 24 * 60 * 60 * 1000;
const dateKey = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY_MS).toISOString().split('T')[0];

async function createApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  // Same pipeline as main.ts.
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  await app.init();
  return app;
}

describe('EmpTrack security and workflows (e2e)', () => {
  let app: INestApplication<App>;
  let http: () => any;
  // Tokens minted directly through SessionService so the suite doesn't trip the
  // 10-per-minute login throttle; the login endpoint itself is tested separately.
  const tokens: Record<string, string> = {};
  const as = (empId: string) => ({ Authorization: `Bearer ${tokens[empId]}` });

  beforeAll(async () => {
    app = await createApp();
    http = () => request(app.getHttpServer());
    const sessions = app.get(SessionService);
    for (const id of ['EM001', 'EM002', 'EM003', 'TL001', 'TL002', 'HR001', 'HR002', 'AD001', 'AD002', 'SA001', 'PA001', 'PA002']) {
      tokens[id] = sessions.create(id).token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('authentication', () => {
    it('keeps the health route public', () => http().get('/').expect(200));

    it('rejects protected routes without a token', () => http().get('/employees/EM001').expect(401));

    it('ignores spoofed identity headers without a token', () =>
      http().get('/analytics/overview').set({ role: 'SUPER_ADMIN', 'x-actor-id': 'SA001' }).expect(401));

    it('derives the role from the session, not from a Role header', () =>
      http().get('/analytics/overview').set(as('EM001')).set({ role: 'SUPER_ADMIN', 'x-actor-id': 'SA001' }).expect(403));

    it('lets the real Super Admin through', () => http().get('/analytics/overview').set(as('SA001')).expect(200));

    it('rejects a malformed / unknown token', () =>
      http().get('/employees/EM001').set({ Authorization: 'Bearer not-a-real-token' }).expect(401));

    it('rejects a wrong password with a generic message', async () => {
      const res = await http().post('/auth/login').send({ email: 'emp@emp.com', password: 'Wrong@1234' }).expect(401);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('rejects login for an inactive account', () =>
      http().post('/auth/login').send({ email: 'karthik.platform@emptrack.com', password: PASSWORD }).expect(401));

    it('issues a working token on login, never returns the password, and revokes it on logout', async () => {
      const res = await http().post('/auth/login').send({ email: 'EMP@emp.com', password: PASSWORD }).expect(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.expiresAt).toBeGreaterThan(Date.now());
      expect(res.body.user.password).toBeUndefined();
      const auth = { Authorization: `Bearer ${res.body.token}` };
      await http().get('/employees/EM001').set(auth).expect(200);
      await http().get('/auth/me').set(auth).expect(200);
      await http().post('/auth/logout').set(auth).expect(200);
      await http().get('/employees/EM001').set(auth).expect(401);
      await http().get('/auth/me').set(auth).expect(401);
      // A second logout with the dead token is just another unauthenticated request.
      await http().post('/auth/logout').set(auth).expect(401);
    });

    it('rejects logout without a token', () => http().post('/auth/logout').expect(401));

    it('rejects GET /auth/me without a token', () => http().get('/auth/me').expect(401));

    it('returns the session user from GET /auth/me, ignoring spoofed identity headers', async () => {
      const res = await http().get('/auth/me').set(as('EM001')).set({ role: 'SUPER_ADMIN', 'x-actor-id': 'SA001' }).expect(200);
      expect(res.body.user.emp_id).toBe('EM001');
      expect(res.body.user.role).toBe('EMPLOYEE');
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects an expired session on every protected endpoint', async () => {
      const { token } = app.get(SessionService).create('EM001');
      const auth = { Authorization: `Bearer ${token}` };
      await http().get('/auth/me').set(auth).expect(200);
      const realNow = Date.now();
      const clock = jest.spyOn(Date, 'now').mockReturnValue(realNow + 8 * 60 * 60 * 1000 + 1000);
      try {
        await http().get('/auth/me').set(auth).expect(401);
        await http().get('/employees/EM001').set(auth).expect(401);
        await http().get('/tasks').set(auth).expect(401);
      } finally {
        clock.mockRestore();
      }
      // Expired sessions are deleted, not just hidden: still rejected with the clock back.
      await http().get('/auth/me').set(auth).expect(401);
    });

    it('marks API responses as non-cacheable', async () => {
      const res = await http().get('/employees/EM001').set(as('EM001')).expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      const denied = await http().get('/employees/EM001').expect(401);
      expect(denied.headers['cache-control']).toBe('no-store');
    });
  });

  describe('employees', () => {
    it('lets an employee read their own manager (same company)', () =>
      http().get('/employees/TL001').set(as('EM001')).expect(200));

    it('hides employees of another company', () => http().get('/employees/EM003').set(as('HR001')).expect(404));

    it('scopes HR ?managerId= listings to their own company', async () => {
      const res = await http().get('/employees').query({ managerId: 'TL002' }).set(as('HR001')).expect(200);
      expect(res.body).toEqual([]);
    });

    it('ignores role/companyId/password in a Company Admin update (mass assignment)', async () => {
      const res = await http()
        .patch('/employees/EM002')
        .set(as('AD001'))
        .send({ phone: '4445556666', role: 'SUPER_ADMIN', companyId: 'C002', password: 'plain' })
        .expect(200);
      expect(res.body.role).toBe('EMPLOYEE');
      expect(res.body.companyId).toBe('C001');
      expect(res.body.password).toBeUndefined();
    });

    it("blocks a Company Admin from editing or deleting another company's employee", async () => {
      await http().patch('/employees/EM001').set(as('AD002')).send({ phone: '9876543210' }).expect(404);
      await http().delete('/employees/EM001').set(as('AD002')).expect(404);
    });

    it('rejects an invalid status value', () =>
      http().patch('/employees/EM002').set(as('AD001')).send({ status: 'GOD_MODE' }).expect(400));

    it("blocks changing someone else's password", () =>
      http().patch('/employees/EM002/password').set(as('EM001'))
        .send({ currentPassword: PASSWORD, newPassword: 'Another@123', confirmPassword: 'Another@123' }).expect(403));

    it('rejects a wrong current password with 400 (not 401, which would end the session)', () =>
      http().patch('/employees/EM003/password').set(as('EM003'))
        .send({ currentPassword: 'Wrong@1234', newPassword: 'Another@123', confirmPassword: 'Another@123' }).expect(400));

    it('actually changes the password (regression: it always failed before)', async () => {
      await http().patch('/employees/EM003/password').set(as('EM003'))
        .send({ currentPassword: PASSWORD, newPassword: 'Changed@123', confirmPassword: 'Changed@123' }).expect(200);
      await http().post('/auth/login').send({ email: 'emp3@emp.com', password: 'Changed@123' }).expect(200);
      await http().post('/auth/login').send({ email: 'emp3@emp.com', password: PASSWORD }).expect(401);
    });
  });

  describe('leave', () => {
    let leaveId: string;

    it("blocks reading another company's / unrelated employee's leaves", async () => {
      await http().get('/leaves/user/EM003').set(as('EM001')).expect(403);
      await http().get('/leaves/user/EM002').set(as('EM001')).expect(403);
    });

    it('lets HR read leaves inside their company', () => http().get('/leaves/user/EM001').set(as('HR001')).expect(200));

    it('scopes GET /leaves to the caller company', async () => {
      const res = await http().get('/leaves').set(as('HR002')).expect(200);
      expect(res.body.every((l: any) => l.emp_id !== 'EM001')).toBe(true);
    });

    it('rejects reversed, malformed and impossible dates and unknown leave types', async () => {
      const base = { leave_type: 'CASUAL', reason: 'Family trip' };
      await http().post('/leaves').set(as('EM001')).send({ ...base, start_date: dateKey(10), end_date: dateKey(9) }).expect(400);
      await http().post('/leaves').set(as('EM001')).send({ ...base, start_date: 'tomorrow', end_date: dateKey(9) }).expect(400);
      await http().post('/leaves').set(as('EM001')).send({ ...base, start_date: '2026-02-30', end_date: '2026-03-01' }).expect(400);
      await http().post('/leaves').set(as('EM001')).send({ ...base, leave_type: 'FOREVER', start_date: dateKey(9), end_date: dateKey(9) }).expect(400);
    });

    it('refuses to file leave on behalf of someone else', () =>
      http().post('/leaves').set(as('EM001'))
        .send({ empId: 'EM002', leave_type: 'SICK', reason: 'Feeling unwell', start_date: dateKey(40), end_date: dateKey(40) }).expect(403));

    it('creates a leave for the caller and computes days server-side', async () => {
      const res = await http().post('/leaves').set(as('EM001'))
        .send({ empId: 'EM001', leave_type: 'CASUAL', reason: 'Trip', days: '99', start_date: dateKey(30), end_date: dateKey(32) })
        .expect(201);
      expect(res.body.emp_id).toBe('EM001');
      expect(res.body.days).toBe('3');
      expect(res.body.status).toBe('PENDING');
      leaveId = res.body.leave_id;
    });

    it('rejects duplicate / overlapping requests', () =>
      http().post('/leaves').set(as('EM001'))
        .send({ leave_type: 'SICK', reason: 'again', start_date: dateKey(31), end_date: dateKey(35) }).expect(409));

    it('blocks approval by an employee, or by a Team Lead of another company', async () => {
      await http().patch(`/leaves/${leaveId}/status`).set(as('EM002')).send({ status: 'APPROVED' }).expect(403);
      await http().patch(`/leaves/${leaveId}/status`).set(as('TL002')).send({ status: 'APPROVED' }).expect(403);
    });

    it('rejects an unknown decision value', () =>
      http().patch(`/leaves/${leaveId}/status`).set(as('TL001')).send({ status: 'MAYBE' }).expect(400));

    it('records the real approver regardless of the body, and only decides once', async () => {
      const res = await http().patch(`/leaves/${leaveId}/status`).set(as('TL001'))
        .send({ status: 'APPROVED', approved_by_id: 'SA001' }).expect(200);
      expect(res.body.approved_by).toBe('TL001');
      await http().patch(`/leaves/${leaveId}/status`).set(as('HR001')).send({ status: 'REJECTED' }).expect(409);
    });

    it('forbids self-approval', async () => {
      const res = await http().post('/leaves').set(as('TL001'))
        .send({ leave_type: 'CASUAL', reason: 'Rest', start_date: dateKey(50), end_date: dateKey(50) }).expect(201);
      await http().patch(`/leaves/${res.body.leave_id}/status`).set(as('TL001')).send({ status: 'APPROVED' }).expect(403);
      await http().patch(`/leaves/${res.body.leave_id}/status`).set(as('HR001')).send({ status: 'APPROVED' }).expect(200);
    });
  });

  describe('attendance', () => {
    it('refuses to check someone else in', () =>
      http().post('/attendance/check-in').set(as('EM001')).send({ empId: 'EM002', checkInTime: '06:00' }).expect(403));

    it('rejects check-out before check-in', () => http().post('/attendance/check-out').set(as('EM002')).send({}).expect(400));

    it('rejects an unknown mode', () =>
      http().post('/attendance/check-in').set(as('EM002')).send({ mode: 'MOON' }).expect(400));

    it('stamps check-in with the server clock and blocks duplicates', async () => {
      const res = await http().post('/attendance/check-in').set(as('EM002')).send({ checkInTime: '01:00', mode: 'REMOTE' }).expect(201);
      expect(res.body.emp_id).toBe('EM002');
      expect(res.body.check_in_time).not.toBe('01:00');
      expect(res.body.check_in_time).toMatch(/^\d{2}:\d{2}$/);
      await http().post('/attendance/check-in').set(as('EM002')).send({}).expect(409);
    });

    it('checks out once, with numeric hours', async () => {
      const res = await http().post('/attendance/check-out').set(as('EM002')).send({}).expect(201);
      expect(typeof res.body.hours_spent).toBe('number');
      await http().post('/attendance/check-out').set(as('EM002')).send({}).expect(409);
    });

    it("blocks reading another company's attendance", () =>
      http().get('/attendance/user/EM001').set(as('HR002')).expect(403));
  });

  describe('tasks', () => {
    let taskId: string;
    const valid = () => ({ task_title: 'Write tests', assigned_to: 'EM001', priority: 'Medium', deadline: dateKey(7), est_hours: '4' });

    it('blocks assigning to an employee outside your team/company', () =>
      http().post('/tasks').set(as('TL002')).send(valid()).expect(403));

    it('validates deadline and priority', async () => {
      await http().post('/tasks').set(as('TL001')).send({ ...valid(), deadline: dateKey(-1) }).expect(400);
      await http().post('/tasks').set(as('TL001')).send({ ...valid(), deadline: 'soon' }).expect(400);
      await http().post('/tasks').set(as('TL001')).send({ ...valid(), priority: 'URGENT!!' }).expect(400);
      await http().post('/tasks').set(as('TL001')).send({ ...valid(), est_hours: '-2' }).expect(400);
    });

    it('creates a task and keeps the estimate', async () => {
      const res = await http().post('/tasks').set(as('TL001')).send(valid()).expect(201);
      expect(res.body.est_hours).toBe(4);
      expect(res.body.assigned_by).toBe('TL001');
      taskId = res.body.task_id;
    });

    it("blocks other employees from touching the task, and the assignee from editing its terms", async () => {
      await http().patch(`/tasks/${taskId}`).set(as('EM002')).send({ status: 'IN_PROGRESS' }).expect(403);
      await http().patch(`/tasks/${taskId}`).set(as('EM001')).send({ deadline: dateKey(90) }).expect(403);
    });

    it('validates status and progress range', async () => {
      await http().patch(`/tasks/${taskId}`).set(as('EM001')).send({ status: 'DONE-ISH' }).expect(400);
      await http().patch(`/tasks/${taskId}`).set(as('EM001')).send({ progress_percentage: 150 }).expect(400);
    });

    it('lets the assignee complete it, forcing 100% progress', async () => {
      const res = await http().patch(`/tasks/${taskId}`).set(as('EM001')).send({ status: 'COMPLETED', progress_percentage: 40 }).expect(200);
      expect(res.body.progress_percentage).toBe(100);
    });

    it("ignores a Team Lead's spoofed ?managerId=", async () => {
      const res = await http().get('/tasks').query({ managerId: 'TL001' }).set(as('TL002')).expect(200);
      expect(res.body.some((t: any) => t.assigned_to === 'EM001')).toBe(false);
    });
  });

  describe('issues, notifications, escalations, calendar, companies', () => {
    it('scopes GET /issues to the caller company', async () => {
      const res = await http().get('/issues').set(as('HR002')).expect(200);
      expect(res.body.some((i: any) => ['EM001', 'EM002', 'TL001'].includes(i.emp_id))).toBe(false);
    });

    it('blocks employees from editing issues and raising them as someone else', async () => {
      await http().patch('/issues/ISS-001').set(as('EM001')).send({ status: 'Resolved' }).expect(403);
      await http().post('/issues').set(as('EM001'))
        .send({ emp_id: 'EM002', title: 'Laptop issue', type: 'Hardware', priority: 'Low', description: 'Laptop will not boot up.' }).expect(403);
    });

    it('does not let an issue update rewrite its owner', async () => {
      const res = await http().patch('/issues/ISS-001').set(as('TL001')).send({ status: 'In Progress', emp_id: 'EM003' }).expect(200);
      expect(res.body.emp_id).toBe('EM001');
    });

    it('keeps notifications private and sends only within your team', async () => {
      await http().get('/notifications/user/EM002').set(as('EM001')).expect(403);
      await http().post('/notifications').set(as('TL002')).send({ employee_id: 'EM001', message: 'hi' }).expect(403);
      await http().post('/notifications').set(as('EM001')).send({ employee_id: 'EM002', message: 'hi' }).expect(403);
      await http().post('/notifications').set(as('TL001')).send({ employee_id: 'EM001', message: 'Ping', type: 'warning' }).expect(201);
      const res = await http().get('/notifications/user/EM001').set(as('EM001')).expect(200);
      expect(res.body[0].message).toBe('Ping');
    });

    it('scopes escalations to the caller company', async () => {
      const res = await http().get('/escalations').set(as('HR002')).expect(200);
      expect(res.body.some((e: any) => e.escalation_id === 'E001')).toBe(false);
      await http().patch('/escalations/E001/reject').set(as('HR002')).expect(403);
      await http().patch('/escalations/NOPE/reject').set(as('HR001')).expect(404);
    });

    it("ignores the calendar's requesterEmpId query param", async () => {
      const res = await http().get('/calendar/my-calendar').query({ requesterEmpId: 'EM003' }).set(as('EM001')).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('Founders Day'); // a C002 holiday
    });

    it("hides another Platform Admin's company", async () => {
      await http().get('/companies/C001').set(as('PA002')).expect(404);
      await http().get('/companies/C003').set(as('PA002')).expect(200);
    });

    it('logs out a deactivated account on its next request', async () => {
      await http().get('/employees/EM002').set(as('EM002')).expect(200);
      await http().patch('/employees/EM002').set(as('AD001')).send({ status: 'INACTIVE' }).expect(200);
      await http().get('/employees/EM002').set(as('EM002')).expect(401);
    });
  });
});

describe('login throttling (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles repeated login attempts', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'emp@emp.com', password: 'Wrong@1234' });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[11]).toBe(429);
  });
});

// Platform side (Platform Admin / Support Member / Technical Member). Own app
// instance so the seed tickets are in their original state.
describe('platform tickets: tenancy, assignment and status rules (e2e)', () => {
  let app: INestApplication<App>;
  let http: () => any;
  const tokens: Record<string, string> = {};
  const as = (empId: string) => ({ Authorization: `Bearer ${tokens[empId]}` });

  beforeAll(async () => {
    app = await createApp();
    http = () => request(app.getHttpServer());
    const sessions = app.get(SessionService);
    for (const id of ['EM001', 'HR001', 'AD001', 'PA001', 'PA002', 'ST001', 'ST003', 'TT001', 'TT003']) {
      tokens[id] = sessions.create(id).token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('role boundaries', () => {
    it('keeps company-side roles out of the platform portals', async () => {
      await http().get('/support-tickets').set(as('EM001')).expect(403);
      await http().get('/technical-member/stats').set(as('HR001')).expect(403);
      await http().get('/support-member/stats').set(as('AD001')).expect(403);
      await http().get('/companies').set(as('AD001')).expect(403);
    });

    it('keeps platform roles inside their own portal', async () => {
      await http().get('/technical-member/issues').set(as('ST001')).expect(403);
      await http().get('/support-member/tickets').set(as('TT001')).expect(403);
      await http().get('/analytics/overview').set(as('PA001')).expect(403);
      await http().patch('/platform-settings').set(as('PA001')).send({ platform_name: 'x' }).expect(403);
    });

    it('does not expose company employees to platform staff', async () => {
      await http().get('/employees/EM001').set(as('PA001')).expect(404);
      await http().get('/employees/EM001').set(as('ST001')).expect(404);
    });
  });

  describe("another Platform Admin's tickets and members", () => {
    it("hides another Platform Admin's tickets", async () => {
      await http().get('/support-tickets/TIX-004').set(as('PA002')).expect(404);
      await http().get('/technical-issues/TIX-001').set(as('PA002')).expect(404);
      await http().patch('/support-tickets/TIX-004/assign').set(as('PA002')).send({ assigned_to: 'ST003' }).expect(404);
    });

    it("blocks editing another Platform Admin's team members", async () => {
      await http().patch('/support-team/ST001').set(as('PA002')).send({ emp_name: 'Renamed' }).expect(404);
      await http().patch('/technical-team/TT001/status').set(as('PA002')).send({ status: 'INACTIVE' }).expect(404);
    });

    it("hides tickets from another team's Support / Technical Members", async () => {
      await http().get('/support-member/tickets/TIX-005').set(as('ST003')).expect(404);
      await http().patch('/support-member/tickets/TIX-005/status').set(as('ST003')).send({ status: 'OPEN' }).expect(404);
      await http().get('/technical-member/issues/TIX-011').set(as('TT003')).expect(404);
      await http().patch('/technical-member/issues/TIX-011/progress').set(as('TT003')).send({ progress_percentage: 90 }).expect(404);
    });
  });

  describe('ticket assignment', () => {
    it("rejects assigning to another Platform Admin's Support Member", () =>
      http().patch('/support-tickets/TIX-004/assign').set(as('PA001')).send({ assigned_to: 'ST003' }).expect(400));

    it('rejects assigning to a company employee, an unknown id or the wrong team', async () => {
      await http().patch('/support-tickets/TIX-004/assign').set(as('PA001')).send({ assigned_to: 'EM001' }).expect(400);
      await http().patch('/support-tickets/TIX-004/assign').set(as('PA001')).send({ assigned_to: 'ST999' }).expect(400);
      await http().patch('/support-tickets/TIX-004/assign').set(as('PA001')).send({ assigned_to: 'TT001' }).expect(400);
      await http().patch('/technical-issues/TIX-001/assign').set(as('PA001')).send({ assigned_to: 'ST001' }).expect(400);
    });

    it('rejects assigning to an inactive member', () =>
      http().patch('/support-tickets/TIX-004/assign').set(as('PA001')).send({ assigned_to: 'ST002' }).expect(400));

    it('applies the same rules to reassignment', () =>
      http().patch('/technical-issues/TIX-001/reassign').set(as('PA001')).send({ assigned_to: 'TT003', reason: 'Moving to another team' }).expect(400));

    it('leaves the ticket unchanged after a rejected assignment', async () => {
      const res = await http().get('/support-tickets/TIX-004').set(as('PA001')).expect(200);
      expect(res.body.assigned_to).toBeNull();
      expect(res.body.status).toBe('OPEN');
    });

    it("assigns to an active member of the ticket's own team", async () => {
      const res = await http().patch('/support-tickets/TIX-004/assign').set(as('PA001')).send({ assigned_to: 'ST001' }).expect(200);
      expect(res.body.assigned_to).toBe('ST001');
      await http().patch('/technical-issues/TIX-001/assign').set(as('PA001')).send({ assigned_to: 'TT002' }).expect(200);
    });
  });

  describe('support ticket status changes', () => {
    it('moves a ticket between the working states', async () => {
      const res = await http().patch('/support-member/tickets/TIX-005/status').set(as('ST001')).send({ status: 'WAITING_FOR_CUSTOMER' }).expect(200);
      expect(res.body.status).toBe('WAITING_FOR_CUSTOMER');
    });

    it('refuses to reopen a closed ticket through a plain status change', async () => {
      await http().patch('/support-member/tickets/TIX-009/status').set(as('ST001')).send({ status: 'OPEN' }).expect(400);
      const res = await http().get('/support-member/tickets/TIX-009').set(as('ST001')).expect(200);
      expect(res.body.status).toBe('CLOSED');
    });

    it('refuses to resolve, close or escalate through a plain status change', async () => {
      for (const status of ['RESOLVED', 'CLOSED', 'ESCALATED']) {
        await http().patch('/support-member/tickets/TIX-005/status').set(as('ST001')).send({ status }).expect(400);
      }
    });

    it('still reopens a closed ticket through the reopen endpoint', async () => {
      const res = await http()
        .patch('/support-member/tickets/TIX-009/reopen')
        .set(as('ST001'))
        .send({ reason: 'Customer reports the export still fails.' })
        .expect(200);
      expect(res.body.status).toBe('IN_PROGRESS');
    });
  });

  describe('technical issue rules', () => {
    it('rejects out-of-range progress and member-driven closure', async () => {
      await http().patch('/technical-member/issues/TIX-011/progress').set(as('TT001')).send({ progress_percentage: 150 }).expect(400);
      await http().patch('/technical-member/issues/TIX-011/progress').set(as('TT001')).send({ progress_percentage: -1 }).expect(400);
      await http().patch('/technical-member/issues/TIX-011/status').set(as('TT001')).send({ status: 'CLOSED' }).expect(400);
    });

    it('refuses verification of an issue that was never submitted for it', () =>
      http().patch('/technical-issues/TIX-012/verify').set(as('PA001')).send({ note: 'Looks fine' }).expect(400));
  });
});

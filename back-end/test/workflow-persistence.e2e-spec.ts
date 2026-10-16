import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { createValidationPipe } from '../src/common/validation/validators';
import { SessionService } from '../src/auth/session.service';

describe('Issue and escalation persisted API lifecycle', () => {
  let app: INestApplication<App>;
  let directory: string;
  let dbFile: string;
  let previousDbPath: string | undefined;
  let employeeAuth: { Authorization: string };
  let teamLeadAuth: { Authorization: string };
  let hrAuth: { Authorization: string };
  let issueId: string;
  let escalationId: string;
  let taskId: string;
  let worklogId: string;

  const start = async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication<INestApplication<App>>();
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(app.get(HttpExceptionFilter));
    await app.init();
    const sessions = app.get(SessionService);
    employeeAuth = { Authorization: `Bearer ${sessions.create('EM001').token}` };
    teamLeadAuth = { Authorization: `Bearer ${sessions.create('TL001').token}` };
    hrAuth = { Authorization: `Bearer ${sessions.create('HR001').token}` };
  };

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'emptrack-api-workflow-'));
    dbFile = join(directory, 'workflow.sqlite');
    previousDbPath = process.env.EMPTRACK_WORKFLOW_DB;
    process.env.EMPTRACK_WORKFLOW_DB = dbFile;
    await start();
  });

  afterAll(async () => {
    await app.close();
    if (previousDbPath === undefined) delete process.env.EMPTRACK_WORKFLOW_DB;
    else process.env.EMPTRACK_WORKFLOW_DB = previousDbPath;
    rmSync(directory, { recursive: true, force: true });
  });

  it('executes the role-scoped issue, HR escalation, and resolution flow through HTTP', async () => {
    const http = () => request(app.getHttpServer());
    const issueBody = {
      title: 'API workflow issue', type: 'Technical', priority: 'High',
      description: 'This issue verifies persistent issue and escalation operations.',
    };
    const created = await http().post('/issues').set(employeeAuth).send(issueBody).expect(201);
    issueId = created.body.issue_id;
    await http().post('/issues').set(employeeAuth).send(issueBody).expect(409);

    await http().get('/issues/user/EM001').set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ issue_id: issueId })));
    await http().get('/issues').set(teamLeadAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ issue_id: issueId })));
    await http().get('/issues/user/EM001').set({ Authorization: `Bearer ${app.get(SessionService).create('EM002').token}` }).expect(403);
    await http().patch(`/issues/${issueId}`).set(teamLeadAuth).send({ assigned_to: 'Jane Smith (EMP)', status: 'In Progress' }).expect(200);
    await http().patch(`/issues/${issueId}`).set(teamLeadAuth).send({ assigned_to: 'Natasha Romanoff', status: 'In Progress' }).expect(403);
    await http().patch(`/issues/${issueId}`).set(teamLeadAuth).send({ status: 'Open' }).expect(400);
    await http().patch(`/issues/${issueId}`).set(teamLeadAuth).send({ status: 'Resolved' }).expect(400);

    const escalation = await http().post('/escalations').set(teamLeadAuth).send({
      reference_type: 'Technical', reference_id: 'EM001', issue_id: issueId, escalated_to: 'HR',
      escalation_reason: 'HR assistance is required to move this blocked issue forward.', priority: 'High',
    }).expect(201);
    escalationId = escalation.body.escalation_id;
    await http().post('/escalations').set(teamLeadAuth).send({
      reference_type: 'Technical', reference_id: 'EM001', issue_id: issueId, escalated_to: 'HR',
      escalation_reason: 'HR assistance is required to move this blocked issue forward.',
    }).expect(409);
    await http().post('/escalations').set(teamLeadAuth).send({
      reference_type: 'Technical', reference_id: 'EM003', escalated_to: 'HR',
      escalation_reason: 'Cross company escalation attempt should fail.',
    }).expect(403);
    await http().get('/escalations').set(hrAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ escalation_id: escalationId, issue_id: issueId })));
    await http().get('/escalations').set(employeeAuth).expect(403);
    await http().get('/escalations/mine').set(teamLeadAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ escalation_id: escalationId })));
    await http().get('/escalations/mine').set(employeeAuth).expect(403);
    await http().post(`/escalations/${escalationId}/report`).set(employeeAuth).expect(403);
    await http().post(`/escalations/${escalationId}/report`).set(hrAuth).expect(201)
      .expect(({ body }) => {
        expect(body.report).toEqual(expect.objectContaining({
          escalation_id: escalationId,
          employee_name: 'John Doe (EMP)',
          issue_id: issueId,
          issue_title: issueBody.title,
          escalation_reason: 'HR assistance is required to move this blocked issue forward.',
        }));
      });
    await http().patch(`/escalations/${escalationId}/reject`).set(teamLeadAuth).expect(403);
    await http().patch(`/escalations/${escalationId}/reject`).set(hrAuth).expect(200);
    await http().get('/escalations').set(hrAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ escalation_id: escalationId, status: 'REJECTED' })));

    await http().patch(`/issues/${issueId}`).set(teamLeadAuth).send({ status: 'Resolved', resolution: {
      type: 'Configuration Change', time_spent: 1, root_cause: 'The required VPN credentials were expired.',
      actions_taken: 'Credentials were rotated and the employee confirmed the connection is stable.',
    } }).expect(200);
    await http().get(`/issues/user/EM001`).set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ issue_id: issueId, status: 'Resolved' })));
  });

  it('retains issue and escalation records after restarting the Nest application', async () => {
    await app.close();
    await start();
    const http = () => request(app.getHttpServer());
    await http().get('/issues/user/EM001').set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ issue_id: issueId, status: 'Resolved' })));
    await http().get('/escalations').set(hrAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ escalation_id: escalationId, issue_id: issueId })));
  });

  it('creates, assigns, updates, logs, completes, scopes, and persists a task through HTTP', async () => {
    const http = () => request(app.getHttpServer());
    const deadline = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    await http().post('/tasks').set(teamLeadAuth).send({
      assigned_to: 'EM003', task_title: 'Unauthorized assignment', task_description: 'This assignment must be rejected.',
      est_hours: 6, deadline, priority: 'High',
    }).expect(403);
    const createBody = {
      assigned_to: 'EM001', task_title: 'Persisted lifecycle task', task_description: 'Verify task creation through completion.',
      est_hours: 6, deadline, priority: 'High', client_request_id: 'task-lifecycle-e2e-001',
    };
    const created = await http().post('/tasks').set(teamLeadAuth).send(createBody).expect(201);
    taskId = created.body.task_id;
    await http().post('/tasks').set(teamLeadAuth).send(createBody).expect(201)
      .expect(({ body }) => expect(body.task_id).toBe(taskId));
    await http().post('/tasks').set(teamLeadAuth).send({ ...createBody, task_title: 'Different task, reused key' }).expect(400);
    await http().post('/tasks').set(teamLeadAuth).send({ ...createBody, priority: 'URGENT', client_request_id: 'task-invalid-priority' }).expect(400);
    await http().post('/tasks').set(teamLeadAuth).send({ ...createBody, est_hours: -1, client_request_id: 'task-invalid-hours' }).expect(400);
    expect(created.body).toMatchObject({ assigned_to: 'EM001', status: 'NOT_STARTED', progress_percentage: 0 });

    await http().get('/tasks/user/EM001').set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ task_id: taskId })));
    await http().get('/tasks/user/EM001').set({ Authorization: `Bearer ${app.get(SessionService).create('EM002').token}` }).expect(403);
    await http().patch(`/tasks/${taskId}`).set({ Authorization: `Bearer ${app.get(SessionService).create('EM002').token}` })
      .send({ status: 'IN_PROGRESS', progress_percentage: 20 }).expect(403);
    await http().patch(`/tasks/${taskId}`).set(teamLeadAuth).send({ assigned_to: 'EM003' }).expect(200)
      .expect(({ body }) => expect(body.assigned_to).toBe('EM001'));

    await http().patch(`/tasks/${taskId}`).set(teamLeadAuth).send({ est_hours: 8 }).expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ est_hours: 8, assigned_to: 'EM001', status: 'NOT_STARTED', progress_percentage: 0 }));
    await http().patch(`/tasks/${taskId}`).set(teamLeadAuth).send({ est_hours: 0 }).expect(400);
    await http().patch(`/tasks/${taskId}`).set(teamLeadAuth).send({ est_hours: -1 }).expect(400);
    await http().patch(`/tasks/${taskId}`).set(teamLeadAuth).send({ est_hours: 'not-a-number' }).expect(400);
    await http().patch(`/tasks/${taskId}`).set(teamLeadAuth).send({ est_hours: 1001 }).expect(400);

    await http().patch(`/tasks/${taskId}`).set(employeeAuth).send({ status: 'IN_PROGRESS', progress_percentage: 25 }).expect(200);
    await http().patch(`/tasks/${taskId}`).set(employeeAuth).send({ status: 'IN_PROGRESS', progress_percentage: 101 }).expect(400);
    await http().patch(`/tasks/${taskId}`).set(employeeAuth).send({ status: 'IN_PROGRESS', progress_percentage: 100 }).expect(400);

    const day = new Date().toISOString().slice(0, 10);
    const workLog = {
      task_id: taskId, task_title: 'Client supplied title is ignored', hours_spent: 2,
      start_time: `${day}T09:00:00.000Z`, end_time: `${day}T11:00:00.000Z`,
      description: 'Implemented and verified the task lifecycle integration.',
    };
    const logged = await http().post('/worklogs').set(employeeAuth).send(workLog).expect(201);
    worklogId = logged.body.worklog_id;
    expect(logged.body.task_title).toBe('Persisted lifecycle task');
    await http().post('/worklogs').set(employeeAuth).send(workLog).expect(409);
    await http().post('/worklogs').set({ Authorization: `Bearer ${app.get(SessionService).create('EM002').token}` }).send(workLog).expect(403);
    await http().post('/worklogs').set(employeeAuth).send({ ...workLog, task_id: 'UNKNOWN-TASK' }).expect(400);
    await http().post('/worklogs').set(employeeAuth).send({ ...workLog, hours_spent: 1 }).expect(400);
    await http().get('/worklogs/user/EM001').set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ worklog_id: worklogId, task_id: taskId })));

    await http().patch(`/tasks/${taskId}`).set(employeeAuth).send({ status: 'COMPLETED', progress_percentage: 100 }).expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ status: 'COMPLETED', progress_percentage: 100 }));
    await http().patch(`/tasks/${taskId}`).set(employeeAuth).send({ status: 'COMPLETED' }).expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ status: 'COMPLETED', progress_percentage: 100 }));
    await http().post('/worklogs').set(employeeAuth).send({ ...workLog, start_time: `${day}T12:00:00.000Z`, end_time: `${day}T14:00:00.000Z` }).expect(400);
    await http().get('/tasks').query({ managerId: 'TL001' }).set(teamLeadAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ task_id: taskId, status: 'COMPLETED', est_hours: 8 })));
    await http().delete(`/tasks/${taskId}`).set(employeeAuth).expect(403);
    await http().delete(`/tasks/${taskId}`).set(teamLeadAuth).expect(409);
  });

  it('retains task progress and work logs after restarting the Nest application', async () => {
    await app.close();
    await start();
    const http = () => request(app.getHttpServer());
    await http().get('/tasks/user/EM001').set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ task_id: taskId, status: 'COMPLETED', progress_percentage: 100, est_hours: 8 })));
    await http().get('/worklogs/user/EM001').set(employeeAuth).expect(200)
      .expect(({ body }) => expect(body).toContainEqual(expect.objectContaining({ worklog_id: worklogId, task_id: taskId })));
  });
});

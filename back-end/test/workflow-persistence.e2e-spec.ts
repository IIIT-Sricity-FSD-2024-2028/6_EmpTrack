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
});

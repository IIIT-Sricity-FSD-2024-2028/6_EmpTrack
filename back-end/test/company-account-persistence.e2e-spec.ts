import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { createValidationPipe } from '../src/common/validation/validators';
import { WorkflowPersistenceService } from '../src/data/workflow-persistence.service';
import { useIsolatedWorkflowDb } from './helpers/isolatedWorkflowDb';

useIsolatedWorkflowDb('emptrack-account-persistence-');

const PDF = Buffer.from('%PDF-1.4\n% persisted company certificate\n');
const COMPANY = {
  legal_name: 'Northwind Persistence Labs Private Limited',
  business_type: 'PRIVATE_LIMITED',
  registration_number: 'U72200KA2015PTC123457',
  gstin: '',
  company_email: 'contact@northwind-persist.example.com',
  phone: '9876543210',
  address: 'No. 19, Residency Road, Bengaluru',
  country: 'India',
  state: 'Karnataka',
};
const ADMIN = {
  admin_name: 'Asha Rao',
  admin_email: 'asha@northwind-persist.example.com',
  designation: 'Company Administrator',
  password: 'Persist@123',
  confirm_password: 'Persist@123',
  accept_terms: true,
};

describe('Company Admin registration identity persistence (e2e)', () => {
  let app: INestApplication<App>;
  let peerApp: INestApplication<App> | null = null;

  const start = async () => {
    const module: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const instance = module.createNestApplication<INestApplication<App>>();
    instance.useGlobalPipes(createValidationPipe());
    instance.useGlobalFilters(instance.get(HttpExceptionFilter));
    await instance.init();
    return instance;
  };

  beforeAll(async () => { app = await start(); });
  afterAll(async () => { await peerApp?.close(); await app?.close(); });

  it('registers, restarts, and authenticates the same tenant-scoped admin and demo account', async () => {
    const http = () => request(app.getHttpServer());
    const created = await http().post('/company-registrations').send(COMPANY).expect(201);
    const reference = created.body.registration.reference;
    const registrationToken = { 'X-Registration-Token': created.body.token };
    await http().post(`/company-registrations/${reference}/documents/incorporation`).set(registrationToken)
      .attach('file', PDF, { filename: 'incorporation.pdf', contentType: 'application/pdf' }).expect(201);

    const approved = await http().post(`/company-registrations/${reference}/submit`).set(registrationToken).send(ADMIN).expect(200);
    expect(approved.body.status).toBe('verified');
    const beforeRestart = app.get(WorkflowPersistenceService);
    const originalUser = beforeRestart.getUserByEmail(ADMIN.admin_email);
    const originalCompany = beforeRestart.getCompany(originalUser.companyId);
    expect(originalUser).toMatchObject({ role: 'COMPANY_ADMIN', status: 'ACTIVE' });
    expect(originalCompany).toMatchObject({ company_name: COMPANY.legal_name, registration_reference: reference });
    expect(originalUser.password).not.toBe(ADMIN.password);

    const companyId = originalUser.companyId;
    const peer = await start();
    peerApp = peer;
    const peerHttp = () => request(peer.getHttpServer());
    const peerLogin = await peerHttp().post('/auth/login').send({ email: ADMIN.admin_email, password: ADMIN.password }).expect(200);
    expect(peerLogin.body.user).toMatchObject({ role: 'COMPANY_ADMIN', companyId });
    await peerHttp().get('/employees').set({ Authorization: `Bearer ${peerLogin.body.token}` }).expect(200);
    await peer.close();
    peerApp = null;

    await app.close();
    app = await start();

    const restartedHttp = () => request(app.getHttpServer());
    const login = await restartedHttp().post('/auth/login').send({ email: ` ${ADMIN.admin_email.toUpperCase()} `, password: ADMIN.password }).expect(200);
    expect(login.body.user).toMatchObject({ role: 'COMPANY_ADMIN', companyId, company_name: COMPANY.legal_name });
    await restartedHttp().post('/auth/login').send({ email: ADMIN.admin_email, password: 'Incorrect@123' }).expect(401);
    const auth = { Authorization: `Bearer ${login.body.token}` };
    const employeeList = await restartedHttp().get('/employees').set(auth).expect(200);
    expect(employeeList.body.some((user: any) => user.emp_id === 'AD002')).toBe(false);
    await restartedHttp().get('/employees/AD002').set(auth).expect(404);
    await restartedHttp().post('/auth/login').send({ email: 'EMP@emptrack.com', password: 'Password@123' }).expect(200);

    const afterRestart = app.get(WorkflowPersistenceService);
    expect(afterRestart.getUserByEmail(ADMIN.admin_email)).toMatchObject({ role: 'COMPANY_ADMIN', companyId });
    expect(afterRestart.getCompanyRegistration(reference).status).toBe('verified');
    expect(afterRestart.getCompanies().filter((company: any) => company.registration_reference === reference)).toHaveLength(1);
    expect(afterRestart.getUsers().filter((user: any) => user.registration_reference === reference)).toHaveLength(1);

    await restartedHttp().post(`/company-registrations/${reference}/submit`).set(registrationToken).send(ADMIN).expect(409);
  });
});

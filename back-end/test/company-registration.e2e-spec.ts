import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { createValidationPipe } from './../src/common/validation/validators';
import { SessionService } from './../src/auth/session.service';
import { MockDataService } from './../src/data/mock-data.service';
import { useIsolatedWorkflowDb } from './helpers/isolatedWorkflowDb';

useIsolatedWorkflowDb('emptrack-company-registration-');

// Company self-registration: validation, document upload, submission, and the
// Super Admin-only review workflow. Tests share one app and run in order.

const PDF = Buffer.from('%PDF-1.4\n% test document\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

const DETAILS = {
  legal_name: 'Globex Solutions Private Limited',
  business_type: 'PRIVATE_LIMITED',
  registration_number: 'U72200KA2015PTC123456',
  gstin: '29AAGCB7383J1Z4',
  company_email: 'contact@globex.example.com',
  phone: '9876543210',
  address: 'No. 12, MG Road, Bengaluru',
  country: 'India',
  state: 'Karnataka',
  website: 'https://globex.example.com',
};
const ADMIN = {
  admin_name: 'Priya Nair',
  admin_email: 'priya@globex.example.com',
  designation: 'Director',
  password: 'Secure@123',
  confirm_password: 'Secure@123',
  accept_terms: true,
};

describe('Company registration (e2e)', () => {
  let app: INestApplication<App>;
  let http: () => any;
  const tokens: Record<string, string> = {};
  const as = (empId: string) => ({ Authorization: `Bearer ${tokens[empId]}` });
  let ref: string;
  let regToken: string;
  const tok = () => ({ 'X-Registration-Token': regToken });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication<INestApplication<App>>();
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(app.get(HttpExceptionFilter));
    await app.init();
    http = () => request(app.getHttpServer());
    for (const id of ['SA001', 'HR001', 'PA001']) tokens[id] = app.get(SessionService).create(id).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('company details', () => {
    it('requires a CIN for an Indian private limited company', async () => {
      const res = await http().post('/company-registrations').send({ ...DETAILS, registration_number: '' }).expect(400);
      expect(res.body.errors.registration_number[0]).toMatch(/CIN is required/);
    });

    it('rejects a GSTIN with a bad check digit and placeholder registration numbers', async () => {
      const bad = await http().post('/company-registrations').send({ ...DETAILS, gstin: '29AAGCB7383J1Z5' }).expect(400);
      expect(bad.body.errors.gstin).toBeDefined();
      const placeholder = await http().post('/company-registrations')
        .send({ ...DETAILS, business_type: 'OTHER', country: 'Singapore', registration_number: '0000000', gstin: '' }).expect(400);
      expect(placeholder.body.errors.registration_number).toBeDefined();
    });

    it('does not require a registration number for a sole proprietorship', async () => {
      const res = await http().post('/company-registrations')
        .send({ ...DETAILS, legal_name: 'Ravi Stores', business_type: 'SOLE_PROPRIETORSHIP', registration_number: '', gstin: '', company_email: 'ravi@stores.example.com' })
        .expect(201);
      expect(res.body.registration.status).toBe('draft');
    });

    it('validates email and phone', async () => {
      const res = await http().post('/company-registrations').send({ ...DETAILS, company_email: 'not-an-email', phone: 'abc' }).expect(400);
      expect(res.body.errors.company_email).toBeDefined();
      expect(res.body.errors.phone).toBeDefined();
    });

    it('creates a draft and returns an access token once', async () => {
      const res = await http().post('/company-registrations').send(DETAILS).expect(201);
      ref = res.body.registration.reference;
      regToken = res.body.token;
      expect(ref).toMatch(/^REG-/);
      expect(regToken).toHaveLength(64);
      expect(JSON.stringify(res.body.registration)).not.toMatch(/token_hash|password/);
    });

    it('requires the matching access token to read or change the registration', async () => {
      await http().get(`/company-registrations/${ref}`).expect(403);
      await http().get(`/company-registrations/${ref}`).set({ 'X-Registration-Token': 'f'.repeat(64) }).expect(403);
      // A staff session is not a registration token.
      await http().get(`/company-registrations/${ref}`).set(as('SA001')).expect(403);
      const res = await http().get(`/company-registrations/${ref}`).set(tok()).expect(200);
      expect(res.body.status).toBe('draft');
    });

    it('rejects a second registration with the same CIN once the first is submitted (checked below)', async () => {
      // Drafts don't block others; see the duplicate test after submission.
      await http().post('/company-registrations').send({ ...DETAILS, company_email: 'draft2@globex.example.com', legal_name: 'Globex Draft Two' }).expect(201);
    });
  });

  describe('documents', () => {
    it('rejects disallowed types and content that does not match the extension', async () => {
      await http().post(`/company-registrations/${ref}/documents/incorporation`).set(tok())
        .attach('file', Buffer.from('MZ...'), { filename: 'cert.exe', contentType: 'application/octet-stream' }).expect(400);
      await http().post(`/company-registrations/${ref}/documents/incorporation`).set(tok())
        .attach('file', PDF, { filename: 'cert.png', contentType: 'image/png' }).expect(400);
      await http().post(`/company-registrations/${ref}/documents/logo`).set(tok())
        .attach('file', PDF, { filename: 'logo.pdf', contentType: 'application/pdf' }).expect(400);
      await http().post(`/company-registrations/${ref}/documents/passport`).set(tok())
        .attach('file', PDF, { filename: 'p.pdf', contentType: 'application/pdf' }).expect(400);
    });

    it('rejects files over the size limit', async () => {
      const big = Buffer.concat([PDF, Buffer.alloc(6 * 1024 * 1024)]);
      await http().post(`/company-registrations/${ref}/documents/other`).set(tok())
        .attach('file', big, { filename: 'big.pdf', contentType: 'application/pdf' }).expect(413);
    });

    it('rejects uploads without the access token', () =>
      http().post(`/company-registrations/${ref}/documents/incorporation`)
        .attach('file', PDF, { filename: 'cert.pdf', contentType: 'application/pdf' }).expect(403));

    it('stores valid documents and lets the applicant replace one', async () => {
      await http().post(`/company-registrations/${ref}/documents/incorporation`).set(tok())
        .attach('file', PDF, { filename: 'old.pdf', contentType: 'application/pdf' }).expect(201);
      const res = await http().post(`/company-registrations/${ref}/documents/incorporation`).set(tok())
        .attach('file', PDF, { filename: 'coi.pdf', contentType: 'application/pdf' }).expect(201);
      expect(res.body.documents.incorporation.original_name).toBe('coi.pdf');
      expect(res.body.documents.incorporation.stored_name).toBeUndefined();
      await http().post(`/company-registrations/${ref}/documents/logo`).set(tok())
        .attach('file', PNG, { filename: 'logo.png', contentType: 'image/png' }).expect(201);
    });
  });

  describe('submission', () => {
    it('requires the GST certificate when a GSTIN was given', async () => {
      const res = await http().post(`/company-registrations/${ref}/submit`).set(tok()).send(ADMIN).expect(400);
      expect(res.body.message).toMatch(/GST registration certificate/);
      await http().post(`/company-registrations/${ref}/documents/gst`).set(tok())
        .attach('file', PDF, { filename: 'gst.pdf', contentType: 'application/pdf' }).expect(201);
    });

    it('validates the administrator details', async () => {
      await http().post(`/company-registrations/${ref}/submit`).set(tok()).send({ ...ADMIN, confirm_password: 'Other@123' }).expect(400);
      await http().post(`/company-registrations/${ref}/submit`).set(tok()).send({ ...ADMIN, accept_terms: false }).expect(400);
      await http().post(`/company-registrations/${ref}/submit`).set(tok()).send({ ...ADMIN, password: 'weak', confirm_password: 'weak' }).expect(400);
      const taken = await http().post(`/company-registrations/${ref}/submit`).set(tok()).send({ ...ADMIN, admin_email: 'HR@emptrack.com' }).expect(400);
      expect(taken.body.errors.admin_email).toBeDefined();
    });

    it('rejects malformed administrator names and designations through the API', async () => {
      for (const admin_name of ['', '   ', '12345', '@@@', '!!!', '###', 'administrator', 'A'.repeat(101)]) {
        const res = await http().post(`/company-registrations/${ref}/submit`).set(tok())
          .send({ ...ADMIN, admin_name }).expect(400);
        expect(res.body.errors.admin_name).toBeDefined();
      }

      for (const designation of ['', '   ', '@@', '!!!', '###', '12345', 'A', 'A'.repeat(81)]) {
        const res = await http().post(`/company-registrations/${ref}/submit`).set(tok())
          .send({ ...ADMIN, designation }).expect(400);
        expect(res.body.errors.designation).toBeDefined();
      }
    });

    it('automatically approves, activates and authenticates the Company Admin exactly once', async () => {
      const res = await http().post(`/company-registrations/${ref}/submit`).set(tok())
        .send({ ...ADMIN, admin_email: `  ${ADMIN.admin_email.toUpperCase()}  `, admin_name: '\u0905\u0928\u0928\u094d\u092f\u093e \u0936\u0930\u094d\u092e\u093e', designation: 'Co-Founder & CEO' }).expect(200);
      expect(res.body.status).toBe('verified');
      expect(res.body.submitted_at).toBeTruthy();
      expect(res.body.reviewed_at).toBeTruthy();
      expect(JSON.stringify(res.body)).not.toMatch(/password|token_hash/);
      const store = app.get(MockDataService);
      const registration = store.getCompanyRegistrations().find((r: any) => r.reference === ref);
      const company = store.getCompanies().find((c: any) => c.registration_reference === ref);
      const admin = store.getEmployees().find((e: any) => e.registration_reference === ref);
      expect(registration.company_id).toBe(company.company_id);
      expect(company.status).toBe('ACTIVE');
      expect(company.platform_admin_id).toBe('PA001');
      expect(company.subscription_plan_id).toBe('PLAN-BASIC');
      expect(admin).toMatchObject({ role: 'COMPANY_ADMIN', status: 'ACTIVE', companyId: company.company_id, email: ADMIN.admin_email, emp_name: '\u0905\u0928\u0928\u094d\u092f\u093e \u0936\u0930\u094d\u092e\u093e' });
      expect(admin.password).not.toBe(ADMIN.password);

      const login = await http().post('/auth/login').send({ email: `  ${ADMIN.admin_email.toUpperCase()}  `, password: ADMIN.password }).expect(200);
      expect(login.body.user).toMatchObject({ role: 'COMPANY_ADMIN', companyId: company.company_id, company_name: DETAILS.legal_name });
      const auth = { Authorization: `Bearer ${login.body.token}` };
      const employees = await http().get('/employees').set(auth).expect(200);
      expect(employees.body.some((employee: any) => employee.emp_id === 'AD002')).toBe(false);
      await http().get('/employees/AD002').set(auth).expect(404);
      await http().post('/auth/login').send({ email: ADMIN.admin_email, password: 'Wrong@123' }).expect(401);

      const companyCount = store.getCompanies().length;
      const adminCount = store.getEmployees().filter((e: any) => e.registration_reference === ref).length;
      await http().post(`/company-registrations/${ref}/submit`).set(tok()).send(ADMIN).expect(409);
      expect(store.getCompanies()).toHaveLength(companyCount);
      expect(store.getEmployees().filter((e: any) => e.registration_reference === ref)).toHaveLength(adminCount);

      const status = await http().get(`/company-registrations/${ref}`).set(tok()).expect(200);
      expect(status.body.status).toBe('verified');
      expect(status.body.reviewed_at).toBeTruthy();
    });

    it('blocks duplicate submissions and edits after activation', async () => {
      await http().post(`/company-registrations/${ref}/submit`).set(tok()).send(ADMIN).expect(409);
      await http().patch(`/company-registrations/${ref}`).set(tok()).send(DETAILS).expect(409);
      await http().post(`/company-registrations/${ref}/documents/other`).set(tok())
        .attach('file', PDF, { filename: 'x.pdf', contentType: 'application/pdf' }).expect(409);
    });

    it('rejects another registration for the same company', async () => {
      await http().post('/company-registrations').send({ ...DETAILS, legal_name: 'Different Name', company_email: 'x@y.example.com', gstin: '' }).expect(409);
    });
  });

  describe('review', () => {
    it('is closed to applicants and to non-Super-Admin staff', async () => {
      await http().post(`/registration-reviews/${ref}/approve`).set(tok()).send({ platform_admin_id: 'PA001', subscription_plan_id: 'PLAN-PRO' }).expect(401);
      await http().post(`/registration-reviews/${ref}/approve`).set(as('HR001')).send({ platform_admin_id: 'PA001', subscription_plan_id: 'PLAN-PRO' }).expect(403);
      await http().post(`/registration-reviews/${ref}/approve`).set(as('PA001')).send({ platform_admin_id: 'PA001', subscription_plan_id: 'PLAN-PRO' }).expect(403);
      await http().get(`/registration-reviews/${ref}/documents/incorporation`).set(as('HR001')).expect(403);
    });

    it('lists approved registrations and does not allow an unnecessary review', async () => {
      const list = await http().get('/registration-reviews').query({ status: 'verified' }).set(as('SA001')).expect(200);
      expect(list.body.map((r: any) => r.reference)).toContain(ref);
      expect(list.body.every((r: any) => r.status === 'verified')).toBe(true);
      const doc = await http().get(`/registration-reviews/${ref}/documents/incorporation`).set(as('SA001')).expect(200);
      expect(doc.headers['content-type']).toMatch(/application\/pdf/);
      // Not reachable through the generic upload download route either.
      await http().get(`/uploads/company-verification/x.pdf`).set(as('SA001')).expect(400);
      await http().post(`/registration-reviews/${ref}/start-review`).set(as('SA001')).expect(409);
    });

    it('does not allow manual approval or rejection after automatic activation', async () => {
      const store = app.get(MockDataService);
      const companyCount = store.getCompanies().length;
      const adminCount = store.getEmployees().length;
      await http().post(`/registration-reviews/${ref}/approve`).set(as('SA001'))
        .send({ platform_admin_id: 'PA001', subscription_plan_id: 'PLAN-PRO' }).expect(409);
      await http().post(`/registration-reviews/${ref}/reject`).set(as('SA001'))
        .send({ reason: 'The certificate is unreadable.' }).expect(409);
      expect(store.getCompanies()).toHaveLength(companyCount);
      expect(store.getEmployees()).toHaveLength(adminCount);
    });
  });
});

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { MockDataService } from '../data/mock-data.service';
import { FileLoggerService } from '../common/logger/file-logger.service';
import { hashPassword } from '../common/utils/password.util';
import { emailTaken } from '../common/utils/account.util';
import { contentMatchesExtension, extensionOf } from '../common/utils/file-signature.util';
import {
  ApproveRegistrationDto,
  CompanyDetailsDto,
  RejectRegistrationDto,
  SubmitRegistrationDto,
} from './dto/company-registration.dto';

type Actor = { emp_id: string; emp_name: string; role: string };

const MB = 1024 * 1024;
const DOC_FORMATS = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const IMAGE_FORMATS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

// Whitelisted document slots. The slot name comes from the URL and is only ever used
// as a lookup key here - never as part of a filesystem path.
export const REGISTRATION_DOCUMENTS: Record<string, { label: string; formats: Record<string, string>; maxBytes: number }> = {
  incorporation: { label: 'Certificate of Incorporation / registration document', formats: DOC_FORMATS, maxBytes: 5 * MB },
  gst: { label: 'GST registration certificate', formats: DOC_FORMATS, maxBytes: 5 * MB },
  other: { label: 'Other supporting document', formats: DOC_FORMATS, maxBytes: 5 * MB },
  logo: { label: 'Company logo', formats: IMAGE_FORMATS, maxBytes: 2 * MB },
};

// Applicants may only edit while drafting or after a rejection; reviewers act on the rest.
const EDITABLE = ['draft', 'rejected'];
const REVIEWABLE = ['pending', 'under_review'];
// Registrations that "own" their company identifiers / admin email against newcomers.
const ACTIVE = ['pending', 'under_review', 'verified'];

const CIN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const LLPIN = /^[A-Z]{3}-\d{4}$/;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const GENERIC_REG_NO = /^[A-Z0-9][A-Z0-9/-]{2,49}$/;
const B36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** GSTIN's 15th character is a mod-36 check digit over the first 14. */
export function gstinChecksumValid(gstin: string): boolean {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = B36.indexOf(gstin[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return B36[(36 - (sum % 36)) % 36] === gstin[14];
}

const isIndia = (country: string) => /^(india|in|bharat)$/i.test(country.trim());

/**
 * Cross-field identifier rules. These are format/checksum checks only - they prove a
 * value is well-formed, not that the company exists; that is the reviewer's job.
 * Not every business type has a CIN/LLPIN, so it is only required where it applies.
 */
export function identifierErrors(dto: CompanyDetailsDto): Record<string, string> {
  const errors: Record<string, string> = {};
  const regNo = dto.registration_number || '';
  const gstin = dto.gstin || '';
  if (isIndia(dto.country)) {
    if (dto.business_type === 'PRIVATE_LIMITED' || dto.business_type === 'PUBLIC_LIMITED') {
      if (!regNo) errors.registration_number = 'CIN is required for a company registered in India.';
      else if (!CIN.test(regNo)) errors.registration_number = 'CIN must be 21 characters, e.g. U72200KA2015PTC123456.';
    } else if (dto.business_type === 'LLP') {
      if (!regNo) errors.registration_number = 'LLPIN is required for an LLP registered in India.';
      else if (!LLPIN.test(regNo)) errors.registration_number = 'LLPIN must look like AAB-1234.';
    }
    if (gstin && !(GSTIN.test(gstin) && gstinChecksumValid(gstin))) errors.gstin = 'GSTIN is not valid. Check all 15 characters.';
  } else if (gstin) {
    errors.gstin = 'GSTIN applies only to businesses registered in India.';
  }
  if (regNo && !errors.registration_number && !CIN.test(regNo) && !LLPIN.test(regNo)) {
    // Free-form registration numbers: reject obvious placeholders such as "0000" or "XXXX".
    if (!GENERIC_REG_NO.test(regNo) || /^(.)\1+$/.test(regNo.replace(/[/-]/g, ''))) {
      errors.registration_number = 'Enter the registration number exactly as it appears on your registration certificate.';
    }
  }
  return errors;
}

function fieldError(errors: Record<string, string>) {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: Object.values(errors),
    errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])),
  });
}

const sha256 = (value: string) => createHash('sha256').update(value).digest();
const lower = (v?: string | null) => (v || '').trim().toLowerCase();
const now = () => new Date().toISOString();

@Injectable()
export class CompanyRegistrationService {
  private readonly docDir: string;

  constructor(
    private readonly dataStore: MockDataService,
    private readonly logger: FileLoggerService,
  ) {
    // Deliberately outside the generic /uploads/:category whitelist and never served
    // statically: the reviewer download endpoint is the only way to read these back.
    this.docDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'company-verification');
    fs.mkdirSync(this.docDir, { recursive: true });
  }

  // ---- applicant side (authorised by the per-registration access token) ----

  create(dto: CompanyDetailsDto) {
    const company = this.normalise(dto);
    this.assertNoDuplicateCompany(company, null);
    const token = randomBytes(32).toString('hex');
    const reg: any = {
      reference: `REG-${randomBytes(5).toString('hex').toUpperCase()}`,
      token_hash: sha256(token).toString('hex'),
      status: 'draft',
      company,
      documents: {},
      admin: null,
      rejection_reason: null,
      company_id: null,
      created_at: now(),
      updated_at: now(),
      submitted_at: null,
      reviewed_by: null,
      reviewed_at: null,
      history: [],
    };
    this.record(reg, 'Registration started', 'Applicant');
    this.dataStore.getCompanyRegistrations().push(reg);
    // The token is returned exactly once; only its hash is stored.
    return { registration: this.applicantView(reg), token };
  }

  get(reference: string, token: string) {
    return this.applicantView(this.authorise(reference, token));
  }

  update(reference: string, token: string, dto: CompanyDetailsDto) {
    const reg = this.authorise(reference, token);
    this.assertEditable(reg);
    const company = this.normalise(dto);
    this.assertNoDuplicateCompany(company, reg.reference);
    reg.company = company;
    reg.updated_at = now();
    return this.applicantView(reg);
  }

  uploadDocument(reference: string, token: string, docType: string, file: Express.Multer.File) {
    const reg = this.authorise(reference, token);
    this.assertEditable(reg);
    const rules = REGISTRATION_DOCUMENTS[docType];
    if (!rules) throw new BadRequestException('Unknown document type.');
    if (!file || !file.buffer?.length) throw new BadRequestException('No file was provided, or the file is empty.');

    const ext = extensionOf(file.originalname);
    const allowed = Object.keys(rules.formats);
    // Extension, declared MIME type and the actual bytes must all agree.
    if (!rules.formats[ext] || rules.formats[ext] !== file.mimetype || !contentMatchesExtension(file.buffer, ext)) {
      this.logger.warn('Registration document rejected', { reference, docType, ext, mimeType: file.mimetype, sizeBytes: file.size });
      throw new BadRequestException(`Invalid file. Allowed formats for ${rules.label}: ${allowed.join(', ')}.`);
    }
    if (file.size > rules.maxBytes) {
      throw new BadRequestException(`File too large. Maximum size for ${rules.label} is ${rules.maxBytes / MB} MB.`);
    }

    const storedName = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(this.docDir, storedName), file.buffer);
    const previous = reg.documents[docType];
    reg.documents[docType] = {
      stored_name: storedName,
      original_name: path.basename(file.originalname).slice(0, 150),
      mime_type: rules.formats[ext],
      size_bytes: file.size,
      uploaded_at: now(),
    };
    if (previous) this.removeFile(previous.stored_name);
    reg.updated_at = now();
    this.logger.info('Registration document stored', { reference, docType, sizeBytes: file.size });
    return this.applicantView(reg);
  }

  submit(reference: string, token: string, dto: SubmitRegistrationDto) {
    const reg = this.authorise(reference, token);
    if (!EDITABLE.includes(reg.status)) throw new ConflictException('This registration has already been submitted.');
    if (dto.password !== dto.confirm_password) throw fieldError({ confirm_password: 'Passwords do not match.' });

    const missing = this.missingDocuments(reg);
    if (missing.length) throw new BadRequestException(`Please upload: ${missing.join(', ')}.`);
    this.assertNoDuplicateCompany(reg.company, reg.reference);
    this.assertAdminEmailAvailable(dto.admin_email, reg.reference);

    reg.admin = {
      name: dto.admin_name.trim(),
      email: dto.admin_email.trim().toLowerCase(),
      designation: dto.designation.trim(),
      // Plaintext never leaves this function; the account itself is created on approval.
      password_hash: hashPassword(dto.password),
      terms_accepted_at: now(),
    };
    const resubmission = reg.status === 'rejected';
    reg.status = 'pending';
    reg.rejection_reason = null;
    reg.submitted_at = now();
    reg.updated_at = now();
    this.record(reg, resubmission ? 'Resubmitted for verification' : 'Submitted for verification', 'Applicant');
    this.dataStore.logActivity({
      user_id: reg.reference,
      user_name: reg.company.legal_name,
      role: 'APPLICANT',
      action: resubmission ? 'Company registration resubmitted' : 'Company registration submitted',
      details: `${reg.company.legal_name} submitted registration ${reg.reference} for verification.`,
    });
    return this.applicantView(reg);
  }

  // ---- reviewer side (Super Admin session, enforced by the controller) ----

  list(status?: string) {
    return this.dataStore
      .getCompanyRegistrations()
      .filter((r) => r.status !== 'draft' && (!status || r.status === status))
      .map((r) => this.reviewerView(r))
      .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)));
  }

  getForReview(reference: string) {
    return this.reviewerView(this.findSubmitted(reference));
  }

  documentForReview(reference: string, docType: string) {
    const doc = this.findSubmitted(reference).documents[docType];
    if (!doc) throw new NotFoundException('Document not found.');
    const filePath = path.join(this.docDir, doc.stored_name);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Document not found.');
    return { filePath, mimeType: doc.mime_type, originalName: doc.original_name };
  }

  startReview(reference: string, actor: Actor) {
    const reg = this.findSubmitted(reference);
    if (reg.status !== 'pending') throw new ConflictException('Only pending registrations can be moved to review.');
    reg.status = 'under_review';
    this.markReviewed(reg, actor, 'Review started');
    return this.reviewerView(reg);
  }

  approve(reference: string, dto: ApproveRegistrationDto, actor: Actor) {
    const reg = this.findSubmitted(reference);
    if (!REVIEWABLE.includes(reg.status)) throw new ConflictException(`A ${reg.status} registration cannot be approved.`);
    const platformAdmin = this.dataStore.getEmployees().find((e) => e.emp_id === dto.platform_admin_id && e.role === 'PLATFORM_ADMIN');
    if (!platformAdmin || platformAdmin.status !== 'ACTIVE') throw new BadRequestException('Select an active Platform Admin.');
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === dto.subscription_plan_id && p.status === 'ACTIVE');
    if (!plan) throw new BadRequestException('Select an active subscription plan.');
    // Re-checked here: an account or company may have been created since submission.
    if (emailTaken(this.dataStore, reg.admin.email)) {
      throw new ConflictException('An account with the administrator email already exists. Reject this registration with a note.');
    }
    this.assertNoDuplicateCompany(reg.company, reg.reference);

    const c = reg.company;
    const stamp = Date.now();
    const company_id = `COMP-${stamp}`;
    const created_date = now().split('T')[0];
    this.dataStore.getCompanies().push({
      company_id,
      company_name: c.legal_name,
      company_email: c.company_email,
      phone: c.phone,
      industry: null,
      address: `${c.address}, ${c.state}, ${c.country}`,
      status: 'ACTIVE',
      subscription_plan_id: plan.plan_id,
      platform_admin_id: platformAdmin.emp_id,
      created_date,
      business_type: c.business_type,
      registration_number: c.registration_number,
      gstin: c.gstin,
      website: c.website,
      registration_reference: reg.reference,
    });
    this.dataStore.getEmployees().push({
      emp_id: `CA-${stamp}`,
      emp_name: reg.admin.name,
      email: reg.admin.email,
      phone: c.phone,
      password: reg.admin.password_hash,
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
      designation: reg.admin.designation,
      date_of_joining: created_date,
      companyId: company_id,
    });

    reg.status = 'verified';
    reg.company_id = company_id;
    this.markReviewed(reg, actor, 'Approved and company created');
    this.dataStore.logActivity({
      user_id: actor.emp_id, user_name: actor.emp_name, role: actor.role,
      action: 'Company registration approved', company_id, company_name: c.legal_name,
      details: `Verified ${reg.reference}; assigned ${platformAdmin.emp_name} on ${plan.name}.`,
    });
    return this.reviewerView(reg);
  }

  reject(reference: string, dto: RejectRegistrationDto, actor: Actor) {
    const reg = this.findSubmitted(reference);
    if (!REVIEWABLE.includes(reg.status)) throw new ConflictException(`A ${reg.status} registration cannot be rejected.`);
    reg.status = 'rejected';
    reg.rejection_reason = dto.reason;
    // The admin must re-enter a password on resubmission; drop the stored hash.
    reg.admin = { ...reg.admin, password_hash: null };
    this.markReviewed(reg, actor, 'Rejected', dto.reason);
    this.dataStore.logActivity({
      user_id: actor.emp_id, user_name: actor.emp_name, role: actor.role,
      action: 'Company registration rejected', company_name: reg.company.legal_name,
      details: `Rejected ${reg.reference}.`, status: 'WARNING',
    });
    return this.reviewerView(reg);
  }

  // ---- helpers ----

  private authorise(reference: string, token: string) {
    const reg = this.dataStore.getCompanyRegistrations().find((r) => r.reference === reference);
    const given = typeof token === 'string' && token ? sha256(token) : null;
    // Same error for unknown reference and wrong token, compared in constant time. 403,
    // not 401: the frontend treats 401 as "staff session expired" and would log out.
    if (!reg || !given || !timingSafeEqual(given, Buffer.from(reg.token_hash, 'hex'))) {
      throw new ForbiddenException('Registration not found or access token invalid.');
    }
    return reg;
  }

  private findSubmitted(reference: string) {
    const reg = this.dataStore.getCompanyRegistrations().find((r) => r.reference === reference && r.status !== 'draft');
    if (!reg) throw new NotFoundException('Registration not found.');
    return reg;
  }

  private assertEditable(reg: any) {
    if (!EDITABLE.includes(reg.status)) {
      throw new ConflictException('This registration is awaiting verification and can no longer be changed.');
    }
  }

  private normalise(dto: CompanyDetailsDto) {
    const company = {
      legal_name: dto.legal_name.trim(),
      business_type: dto.business_type,
      registration_number: (dto.registration_number || '').trim().toUpperCase() || null,
      gstin: (dto.gstin || '').trim().toUpperCase() || null,
      company_email: dto.company_email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      address: dto.address.trim(),
      country: dto.country.trim(),
      state: dto.state.trim(),
      website: dto.website?.trim() || null,
    };
    const errors = identifierErrors(company as CompanyDetailsDto);
    if (Object.keys(errors).length) throw fieldError(errors);
    return company;
  }

  private missingDocuments(reg: any) {
    const required = ['incorporation', ...(reg.company.gstin ? ['gst'] : [])];
    return required.filter((t) => !reg.documents[t]).map((t) => REGISTRATION_DOCUMENTS[t].label);
  }

  // Synchronous check-then-write: Node runs each request handler to completion, so
  // two concurrent submissions can't both pass this before either is stored.
  // ponytail: holds only while the data store is in-process; a real DB needs unique indexes.
  private assertNoDuplicateCompany(company: any, exceptRef: string | null) {
    const others = this.dataStore.getCompanyRegistrations().filter((r) => r.reference !== exceptRef && ACTIVE.includes(r.status)).map((r) => r.company);
    const existing = this.dataStore.getCompanies().filter((c) => c.registration_reference !== exceptRef);
    const clash = (field: string, label: string, value: string | null, companyField = field) => {
      if (value && (others.some((o) => lower(o[field]) === lower(value)) || existing.some((c) => lower(c[companyField]) === lower(value)))) {
        throw new ConflictException(`A company with this ${label} is already registered or awaiting verification.`);
      }
    };
    clash('legal_name', 'name', company.legal_name, 'company_name');
    clash('company_email', 'business email', company.company_email);
    clash('registration_number', 'registration number', company.registration_number);
    clash('gstin', 'GSTIN', company.gstin);
  }

  private assertAdminEmailAvailable(email: string, exceptRef: string) {
    const pending = this.dataStore
      .getCompanyRegistrations()
      .some((r) => r.reference !== exceptRef && REVIEWABLE.includes(r.status) && lower(r.admin?.email) === lower(email));
    if (pending || emailTaken(this.dataStore, email)) {
      throw fieldError({ admin_email: 'An account with this email already exists or is awaiting verification.' });
    }
  }

  private markReviewed(reg: any, actor: Actor, action: string, note: string | null = null) {
    reg.reviewed_by = actor.emp_name;
    reg.reviewed_at = now();
    reg.updated_at = now();
    this.record(reg, action, actor.emp_name, note);
  }

  private record(reg: any, action: string, by: string, note: string | null = null) {
    reg.history.push({ at: now(), action, by, status: reg.status, note });
  }

  private removeFile(storedName: string) {
    try {
      fs.unlinkSync(path.join(this.docDir, storedName));
    } catch {
      // Already gone - nothing to clean up.
    }
  }

  private documentsView(reg: any) {
    return Object.fromEntries(
      Object.entries(reg.documents).map(([type, d]: [string, any]) => [
        type,
        { label: REGISTRATION_DOCUMENTS[type].label, original_name: d.original_name, mime_type: d.mime_type, size_bytes: d.size_bytes, uploaded_at: d.uploaded_at },
      ]),
    );
  }

  // Never includes the token hash, password hash or stored file names.
  private applicantView(reg: any) {
    return {
      reference: reg.reference,
      status: reg.status,
      company: reg.company,
      documents: this.documentsView(reg),
      missing_documents: this.missingDocuments(reg),
      admin: reg.admin ? { name: reg.admin.name, email: reg.admin.email, designation: reg.admin.designation } : null,
      rejection_reason: reg.rejection_reason,
      submitted_at: reg.submitted_at,
      reviewed_at: reg.reviewed_at,
      updated_at: reg.updated_at,
    };
  }

  private reviewerView(reg: any) {
    return { ...this.applicantView(reg), company_id: reg.company_id, reviewed_by: reg.reviewed_by, history: reg.history };
  }
}

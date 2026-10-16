import { Equals, IsUrl, ValidateIf } from 'class-validator';
import {
  AdministratorNameField,
  BooleanField,
  DesignationField,
  EmailField,
  EnumField,
  IdField,
  LIMITS,
  PasswordInputField,
  PhoneField,
  StrongPasswordField,
  TextField,
  Trim,
} from '../../common/validation/validators';
import { BUSINESS_TYPES, REGISTRATION_STATUSES } from '../../common/validation/enums';

/** Step 1 - company details. CIN/LLPIN/GSTIN rules depend on country + business type,
 *  so those cross-field checks live in identifierErrors() (company-registration.service). */
export class CompanyDetailsDto {
  @TextField('Legal company name', { min: 2, max: 150 }) legal_name: string;
  @EnumField('Business type', BUSINESS_TYPES) business_type: string;
  @TextField('Registration number', { max: 50, optional: true }) registration_number?: string;
  @TextField('GSTIN', { max: 15, optional: true }) gstin?: string;
  @EmailField('Official business email') company_email: string;
  @PhoneField('Business phone number') phone: string;
  @TextField('Registered office address', { min: 10, max: LIMITS.ADDRESS_MAX, multiline: true }) address: string;
  @TextField('Country', { min: 2, max: 60 }) country: string;
  @TextField('State', { min: 2, max: 60 }) state: string;

  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @Trim()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'Company website must be a full URL starting with http:// or https://.' })
  website?: string;
}

/** Step 3 - the Company Admin account, created only when a reviewer approves. */
export class SubmitRegistrationDto {
  @AdministratorNameField('Administrator full name') admin_name: string;
  @EmailField('Official work email') admin_email: string;
  @DesignationField('Designation') designation: string;
  @StrongPasswordField('Password') password: string;
  // Compared with password in CompanyRegistrationService.
  @PasswordInputField('Password confirmation') confirm_password: string;
  @BooleanField('Terms acceptance')
  @Equals(true, { message: 'You must accept the Terms and Conditions and Privacy Policy.' })
  accept_terms: boolean;
}

export class ApproveRegistrationDto {
  @IdField('Platform Admin') platform_admin_id: string;
  @IdField('Subscription plan') subscription_plan_id: string;
}

export class RejectRegistrationDto {
  @TextField('Rejection reason', { min: 10, max: LIMITS.REASON_MAX, multiline: true }) reason: string;
}

export class ListRegistrationsQuery {
  @EnumField('Status', REGISTRATION_STATUSES, { optional: true }) status?: string;
}

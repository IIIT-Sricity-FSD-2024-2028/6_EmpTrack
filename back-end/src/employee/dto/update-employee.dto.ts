import { EmailField, EnumField, IdField, PersonNameField, PhoneField } from '../../common/validation/validators';
import { ACCOUNT_STATUSES } from '../../common/validation/enums';

// The fields the Company Admin's inline edit form sends. Everything else (role,
// companyId, password, manager_id...) is stripped by the global ValidationPipe
// whitelist, so this endpoint can't be used to change someone's role or company or
// to write an unhashed password. Fields may be left out, but not blanked.
export class UpdateEmployeeDto {
  @PersonNameField('Name', { optional: 'partial' }) emp_name?: string;
  @EmailField('Email', { optional: 'partial' }) email?: string;
  @PhoneField('Phone number', { optional: 'partial' }) phone?: string;
  @IdField('Department', { optional: 'partial' }) department_id?: string;
  @EnumField('Status', ACCOUNT_STATUSES, { optional: 'partial' }) status?: string;
}

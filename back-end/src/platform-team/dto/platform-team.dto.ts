import { EmailField, EnumField, LIMITS, PersonNameField, PhoneField, TextField } from '../../common/validation/validators';
import { ACCOUNT_STATUSES } from '../../common/validation/enums';

export class CreateTeamMemberDto {
  @PersonNameField('Name') name: string;
  @EmailField('Email') email: string;
  @PhoneField('Phone number') phone: string;
  @TextField('Specialization', { optional: true, max: LIMITS.SHORT_TEXT_MAX }) specialization?: string;
}

export class UpdateTeamMemberDto {
  @PersonNameField('Name', { optional: 'partial' }) name?: string;
  @EmailField('Email', { optional: 'partial' }) email?: string;
  @PhoneField('Phone number', { optional: 'partial' }) phone?: string;
  @TextField('Specialization', { optional: true, max: LIMITS.SHORT_TEXT_MAX }) specialization?: string;
}

export class UpdateTeamMemberStatusDto {
  @EnumField('Status', ACCOUNT_STATUSES) status: string;
}

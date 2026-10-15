import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional } from 'class-validator';
import { DateField, EnumField, LIMITS, NumericField, TextField, TimeField } from '../../common/validation/validators';
import { ROLE_VALUES } from '../../common/validation/enums';

export const EVENT_TYPES = ['PERSONAL', 'MEETING'];
const EVENT_AUDIENCES = ['ALL', ...ROLE_VALUES];

export class CreateHolidayDto {
  @TextField('Title', { min: 2, max: LIMITS.TITLE_MAX })
  title: string;

  @DateField('Date')
  date: string;
}

export class CreateCompanyEventDto {
  @TextField('Title', { min: 2, max: LIMITS.TITLE_MAX })
  title: string;

  @DateField('Date')
  date: string;

  @IsOptional()
  @IsArray({ message: 'Visible to roles must be a list.' })
  @ArrayMinSize(1, { message: 'Choose at least one role the event is visible to.' })
  @ArrayMaxSize(EVENT_AUDIENCES.length, { message: 'Visible to roles has too many entries.' })
  @IsIn(EVENT_AUDIENCES, { each: true, message: `Visible to roles may only contain: ${EVENT_AUDIENCES.join(', ')}.` })
  visible_to_roles?: string[];
}

export class CreateEventDto {
  @TextField('Title', { min: 2, max: LIMITS.TITLE_MAX })
  title: string;

  @DateField('Date')
  date: string;

  @TimeField('Time', { optional: true })
  time?: string;

  @TextField('Description', { optional: true, max: LIMITS.COMMENT_MAX, multiline: true })
  description?: string;

  @EnumField('Event type', EVENT_TYPES, { optional: true })
  type?: string;
}

/** ?year=2026&month=8 on the calendar feeds. */
export class CalendarQueryDto {
  @NumericField('Year', { integer: true, min: 1970, max: 2100, optional: true })
  year?: string;

  @NumericField('Month', { integer: true, min: 1, max: 12, optional: true })
  month?: string;
}

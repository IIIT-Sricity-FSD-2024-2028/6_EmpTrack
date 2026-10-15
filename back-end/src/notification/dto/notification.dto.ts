import { Matches } from 'class-validator';
import { EnumField, IdField, LIMITS, TextField } from '../../common/validation/validators';

export class CreateNotificationDto {
  @IdField('Recipient')
  employee_id: string;

  @TextField('Message', { max: LIMITS.REASON_MAX, multiline: true })
  message: string;

  @EnumField('Notification type', ['info', 'warning', 'error', 'success'], { optional: true })
  type?: string;

  // In-app links only: a path such as "/employee/tasks". Absolute URLs (including
  // javascript: and data: ones) are rejected so a notification can't link off-site.
  @TextField('Link', { optional: true, max: 300 })
  @Matches(/^\/(?!\/)[^\s\\]*$/, { message: 'Link must be an in-app path starting with "/".' })
  link?: string;
}

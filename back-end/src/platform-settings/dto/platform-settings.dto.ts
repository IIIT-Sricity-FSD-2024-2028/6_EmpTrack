import { IsOptional, Matches, registerDecorator, ValidateNested } from 'class-validator';
import { BooleanField, EmailField, Nested, NumberField, TextField, isTimeZone } from '../../common/validation/validators';

function IsTimeZone() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isTimeZone',
      target: object.constructor,
      propertyName,
      options: { message: 'Timezone must be a valid IANA time zone such as Asia/Kolkata.' },
      validator: { validate: isTimeZone },
    });
}

export class NotificationSettingsDto {
  @BooleanField('Email notifications', { optional: true }) emailNotifications?: boolean;
  @BooleanField('Critical escalation alerts', { optional: true }) criticalEscalationAlerts?: boolean;
  @BooleanField('Weekly digest', { optional: true }) weeklyDigest?: boolean;
  @BooleanField('New company alerts', { optional: true }) newCompanyAlerts?: boolean;
}

export class SecuritySettingsDto {
  // Every password rule in the platform already requires 8+ characters, so a lower
  // minimum would be misleading.
  @NumberField('Minimum password length', { min: 8, max: 32, integer: true, optional: true }) passwordMinLength?: number;
  @NumberField('Session timeout', { min: 5, max: 1440, integer: true, optional: true }) sessionTimeoutMinutes?: number;
  @NumberField('Invitation expiry', { min: 1, max: 720, integer: true, optional: true }) invitationExpiryHours?: number;
  @BooleanField('Two-factor requirement', { optional: true }) twoFactorRequired?: boolean;
}

// Only these settings can be changed; any other key (role_permissions, new
// top-level keys...) is stripped by the ValidationPipe whitelist.
export class UpdatePlatformSettingsDto {
  @TextField('Platform name', { min: 2, max: 60, optional: 'partial' }) platform_name?: string;
  @EmailField('Support email', { optional: 'partial' }) support_email?: string;
  @BooleanField('Maintenance mode', { optional: true }) maintenance_mode?: boolean;

  @TextField('Default currency', { optional: 'partial', max: 3 })
  @Matches(/^[A-Z]{3}$/, { message: 'Default currency must be a 3-letter ISO code such as USD or INR.' })
  default_currency?: string;

  @TextField('Timezone', { optional: 'partial', max: 64 })
  @IsTimeZone()
  timezone?: string;

  @IsOptional()
  @ValidateNested()
  @Nested(() => NotificationSettingsDto)
  notification_settings?: NotificationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Nested(() => SecuritySettingsDto)
  security_settings?: SecuritySettingsDto;
}

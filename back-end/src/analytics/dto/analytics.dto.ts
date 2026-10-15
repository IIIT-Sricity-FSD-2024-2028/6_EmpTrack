import { DateField, EnumField, NotBeforeField } from '../../common/validation/validators';

export const ANALYTICS_RANGES = ['today', '7d', '30d', '6m', '1y'];

/** ?range=6m or ?from=2026-01-01&to=2026-06-30 on the growth/activity charts. */
export class AnalyticsRangeQueryDto {
  @EnumField('Range', ANALYTICS_RANGES, { optional: true })
  range?: string;

  @DateField('From date', { optional: true })
  from?: string;

  @DateField('To date', { optional: true })
  @NotBeforeField('from', 'To date must be on or after the from date.')
  to?: string;
}

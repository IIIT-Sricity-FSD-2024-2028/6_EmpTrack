// Allowed values shared by several modules. They mirror the values already stored
// in the mock data and offered by the frontend selects.

export const ROLE_VALUES = [
  'EMPLOYEE',
  'HR',
  'COMPANY_ADMIN',
  'TEAMLEAD',
  'PLATFORM_ADMIN',
  'SUPPORT_MEMBER',
  'TECHNICAL_MEMBER',
  'SUPER_ADMIN',
] as const;

/** Employee / admin / team-member account status. */
export const ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const COMPANY_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export const PLAN_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const BILLING_CYCLES = ['MONTHLY', 'ANNUAL'] as const;
export const BUSINESS_TYPES = ['PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'LLP', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'OTHER'] as const;
/** Company self-registration lifecycle; only a Super Admin moves it past `pending`. */
export const REGISTRATION_STATUSES = ['draft', 'pending', 'under_review', 'verified', 'rejected'] as const;

/** Compared case-insensitively: the UIs send "Medium", seed data uses "HIGH". */
export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const EMPLOYEE_RANGES = [
  '1-10',
  '11-20',
  '21-50',
  '51-100',
  '101-250',
  '251-500',
  '501-1000',
  '1000+',
];

export const JOB_LOCATIONS = ['onsite', 'remotely', 'hybrid'];
export const WORKING_TIME = ['part-time', 'full-time'];
export const SENIORITY_LEVELS = [
  'Fresh',
  'Junior',
  'Mid-Level',
  'Senior',
  'Team-Lead',
  'CTO',
];

export const ALLOWED_ACTIONS = [
  // User actions
  'USER_BANNED',
  'USER_UNBANNED',
  'USER_CREATED',
  'USER_DELETED',
  'PROFILE_UPDATED',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',

  // Auth actions
  'LOGIN',
  'LOGOUT',
  'TOKEN_REFRESHED',

  // Company actions
  'COMPANY_CREATED',
  'COMPANY_UPDATED',
  'COMPANY_DELETED',
  'COMPANY_APPROVED',
  'COMPANY_BANNED',
  'COMPANY_UNBANNED',
  'VIEW_COMPANY',

  // Job actions
  'JOB_CREATED',
  'JOB_UPDATED',
  'JOB_DELETED',

  // Application actions
  'APPLICATION_SUBMITTED',
  'APPLICATION_STATUS_CHANGED',
];

export const ALLOWED_SORT_FIELDS = ['createdAt', 'action'];
export const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

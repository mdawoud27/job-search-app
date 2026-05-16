export const MSG = {
  // AUTH
  AUTH: {
    // success
    SIGNUP_SUCCESS: 'User created successfully. Please confirm your email',
    OTP_CONFIRMED: 'Account confirmed successfully',
    OTP_SENT: 'OTP sent to email',
    OTP_RESENT: 'New OTP sent successfully',
    LOGIN_SUCCESS: 'User logged in successfully',
    PASSWORD_RESET_SUCCESS: 'Password reset successful. Please login.',
    TOKEN_REFRESHED: 'Access token has been generated',
    GOOGLE_LOGIN_SUCCESS: 'Successfully signed in with Google',
    LOGOUT_SUCCESS: 'Logged out successfully',

    // errors
    INVALID_ROLE: 'Invalid role selection',
    EMAIL_EXISTS: 'Email already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USE_GOOGLE_LOGIN: 'Please use Google to sign in using this email.',
    CONFIRM_EMAIL_FIRST: 'Please confirm your email first',
    EMAIL_ALREADY_CONFIRMED: 'Email already confirmed',
    NO_OTP_FOUND: 'No OTP found',
    OTP_EXPIRED: 'OTP expired',
    INVALID_OTP: 'Invalid OTP',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    EXPIRED_REFRESH_TOKEN: 'Invalid or expired refresh token',
    CREDENTIALS_CHANGED: 'Credentials have been changed. Please login again',
    GOOGLE_AUTH_FAILED: 'Google authentication failed',
    PASSWORD_REQUIRED: 'Password is required.',
    PASSWORD_MIN: 'Password must be at least 8 characters long.',
    PASSWORD_MAX: 'Password must be at most 32 characters long.',
  },

  // USER
  USER: {
    // success
    ACCOUNT_UPDATED: 'Account updated successfully',
    PROFILE_RETRIEVED: 'User profile retrieved successfully',
    PASSWORD_CHANGED: 'Password changed successfully. Please login again',
    PROFILE_PIC_UPLOADED: 'Profile picture uploaded successfully',
    PROFILE_PIC_DELETED: 'Profile picture deleted',
    NO_PROFILE_PIC: 'No profile picture to delete',
    COVER_PIC_UPLOADED: 'Cover picture uploaded successfully',
    COVER_PIC_DELETED: 'Cover picture deleted',
    NO_COVER_PIC: 'No cover picture to delete',
    ACCOUNT_DELETED: 'Account is deleted',
    ACCOUNT_RESTORED: 'Account is restored',

    // errors
    NOT_FOUND: 'User not found',
    NOT_FOUND_OR_UPDATE_FAILED: 'User not found or update failed',
    NOT_LOGGED_IN: 'User is not logged in',
    NOT_LOGGED_IN_ALT: 'You are not logged in',
    DELETED_OR_BANNED: 'Your account has been deleted or banned',
    IS_DELETED_OR_BANNED: 'User is deleted or banned',
    ALREADY_DELETED: 'User is already deleted',
    ALREADY_ACTIVE: 'User is already active and not deleted',
    CANNOT_CHANGE_GOOGLE_PASSWORD:
      'You cannot change the password of a Google account.',
    SAME_PASSWORD: 'New password cannot be the same as the old password',
    INVALID_EMAIL_TYPE: 'Invalid email type',
    NOT_FOUND_OR_BANNED: 'User not found, deleted, or banned',
  },

  // COMPANY
  COMPANY: {
    // success
    CREATED: 'Company created successfully',
    UPDATED: 'Company updated successfully',
    DELETED: 'Company deleted successfully',
    FOUND: 'Company found successfully',
    ALL_FOUND: 'Companies found successfully',
    LOGO_UPLOADED: 'Logo uploaded successfully',
    LOGO_DELETED: 'Logo deleted successfully',
    NO_LOGO: 'No logo to delete',
    COVER_UPLOADED: 'Cover uploaded successfully',
    COVER_DELETED: 'Cover deleted successfully',
    NO_COVER: 'No cover to delete',
    HR_ADDED: 'HR added successfully',
    HR_REMOVED: 'HR removed successfully',
    BANNED: 'Company banned successfully',
    UNBANNED: 'Company unbanned successfully',
    APPROVED: 'Company approved successfully',

    // errors
    NOT_FOUND: 'Company not found',
    NOT_FOUND_OR_INACTIVE: 'Company not found or inactive',
    NOT_FOUND_OR_BANNED: 'Company not found, deleted, or banned',
    DELETED_OR_BANNED: 'Company has been deleted or banned',
    NO_COMPANIES_FOUND: 'No companies found',
    LEGAL_ATTACHMENT_NOT_ALLOWED: 'Legal attachment is not allowed',
    NO_PERMISSION_UPDATE: 'You do not have permission to update this company',
    NO_PERMISSION_DELETE: 'You do not have permission to delete this company',
    ALREADY_BANNED: 'Company is already banned',
    ALREADY_UNBANNED: 'Company is already unbanned',
    ALREADY_APPROVED: 'Company is already approved',
    NOT_APPROVED_YET: 'Company is not approved yet',
  },

  // JOB
  JOB: {
    // success
    CREATED: 'Job created successfully',
    UPDATED: 'Job updated successfully',
    DELETED: 'Job deleted successfully',

    // errors
    NOT_FOUND: 'Job not found',
    NOT_FOUND_OR_DELETED: 'Job not found or already deleted',
    NOT_FOUND_OR_CLOSED: 'Job not found, already deleted, or closed',
    NOT_AUTHORIZED: (action) => `You are not authorized to ${action} this job`,
  },

  // APPLICATION
  APPLICATION: {
    // success
    CREATED: 'Application created successfully',
    ALL_RETRIEVED: 'Applications retrieved successfully',
    STATUS_UPDATED: (status) => `Application ${status} successfully`,

    // errors
    NOT_FOUND: 'Application not found',
    NO_PERMISSION_UPDATE:
      'You do not have permission to update this application',
    INVALID_DATE_FORMAT: 'Invalid date format. Please use YYYY-MM-DD',
    DATE_REQUIRED: 'Date query parameter is required (YYYY-MM-DD)',
    NO_FILE_UPLOADED: 'No file uploaded',
    NO_APPS_FOR_COMPANY: (companyId) =>
      `No applications found for company ${companyId} on the given date`,
  },

  // ADMIN
  ADMIN: {
    // success
    USER_BANNED: 'User banned successfully',
    USER_UNBANNED: 'User unbanned successfully',

    // errors
    USER_ALREADY_BANNED: 'User is already banned',
    USER_ALREADY_UNBANNED: 'User is already unbanned',
  },

  // CHAT
  CHAT: {
    // success
    HISTORY_RETRIEVED: 'Chat history retrieved successfully',

    // errors
    RECEIVER_AND_MESSAGE_REQUIRED: 'Receiver ID and message are required',
    RECEIVER_NOT_FOUND: 'Receiver not found',
    ONLY_HR_CAN_INITIATE: 'Only HR or Company Owner can initiate conversations',
    ONLY_HR_CAN_VIEW_APPLICANTS: 'Only HR or Admin can view job applicants',
    ONLY_HR_CAN_VIEW_COMPANY_JOBS: 'Only HR or Admin can view company jobs',
    JOB_ID_REQUIRED: 'Job ID is required',
    COMPANY_ID_REQUIRED: 'Company ID is required',
    NO_PERMISSION_VIEW_JOBS:
      'You do not have permission to view jobs for this company',
    FAILED_SEND_MESSAGE: 'Failed to send message',
    FAILED_FETCH_APPLICANTS: 'Failed to fetch job applicants',
    FAILED_FETCH_COMPANY_JOBS: 'Failed to fetch company jobs',
    FAILED_FETCH_APPLICATIONS: 'Failed to fetch your applications',
    SOCKET_NOT_INITIALIZED: 'Socket.io not initialized',
  },

  // MIDDLEWARE
  MIDDLEWARE: {
    NO_TOKEN: 'No authorization token provided',
    INVALID_TOKEN: 'Invalid token',
    AUTH_ERROR: 'Authentication error',
    ONLY_USERS_CAN_APPLY: 'Only users can apply for jobs',
    CANNOT_MODIFY_OTHER_USER:
      "You are not allowed to modify another user's account",
    NO_PERMISSION: 'You do not have permission to perform this action',
    HR_REQUIRED: (action) => `You do not have HR permission to ${action}`,
    CORS_ERROR: 'Not allowed by CORS',
  },

  // UPLOAD
  UPLOAD: {
    NO_IMAGE: 'No image uploaded',
    IMAGE_REQUIRED: 'Image is required',
    ONLY_IMAGES: 'Only images are allowed',
    ONLY_PDF: 'Only PDF files are allowed',
  },

  // RATE_LIMIT
  RATE_LIMIT: {
    TOO_MANY_REQUESTS: 'Too many requests, please try again later.',
  },
};

/**
 * Helper function to create mock OTP
 */
export const createOtp = (type = 'confirmEmail', expired = false) => ({
  code: 'hashed_123456',
  type,
  expiresIn: new Date(Date.now() + (expired ? -1000 : 10 * 60 * 1000)),
});

/**
 * Helper function to create mock user
 */
export const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  username: 'testuser',
  password: 'hashed_password',
  role: 'User',
  mobileNumber: 'encrypted_123456',
  profilePic: null,
  coverPic: null,
  isConfirmed: false,
  OTP: [],
  refreshToken: 'mock-refresh-token',
  changeCredentialTime: null,
  deletedAt: null,
  bannedAt: null,
  updatedAt: new Date(),
  updatedBy: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Helper function to create mock admin
 */
export const createMockAdmin = (overrides = {}) => ({
  id: 'admin_123',
  email: 'admin@example.com',
  ...overrides,
});

/**
 * Helper function to create mock company
 */
export const createMockCompany = (overrides = {}) => ({
  _id: 'company_123',
  companyName: 'Test Company',
  companyEmail: 'company@example.com',
  bannedAt: null,
  deletedAt: null,
  logo: null,
  approvedByAdmin: false,
  updatedAt: new Date(),
  updatedBy: null,
  coverPic: null,
  createdBy: { _id: 'user_123', email: 'user@example.com', role: 'HR' },
  jobs: [],
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Helper function to create mock job
 */
export const createMockJob = (overrides = {}) => ({
  _id: 'job_123',
  jobTitle: 'Software Engineer',
  companyId: 'company_123',
  addedBy: 'user_123',
  isVisible: true,
  closed: false,
  ...overrides,
});

/**
 * Helper function to create mock application
 */
export const createMockApplication = (overrides = {}) => ({
  _id: 'application_123',
  userId: 'user_123',
  jobId: 'job_123',
  userCV: {
    secure_url: 'cv.pdf',
    public_id: 'cv_id',
    fileType: 'pdf',
  },
  status: 'pending',
  ...overrides,
});

import jwt from 'jsonwebtoken';
import { User } from '../../src/models/User.js';
import { Company } from '../../src/models/Company.js';
import { Job } from '../../src/models/Job.js';
import bcrypt from 'bcrypt';

/**
 * Generate JWT access token for testing
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET || 'test-access-secret',
    { expiresIn: '1h' },
  );
};

/**
 * Generate JWT refresh token for testing
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    { expiresIn: '7d' },
  );
};

/**
 * Create a test user with specified role
 */
export const createTestUser = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash('Test@1234', 10);

  const userData = {
    firstName: 'Test',
    lastName: 'User',
    email: overrides.email || `test${Date.now()}@example.com`,
    password: hashedPassword,
    username: overrides.username || `testuser${Date.now()}`,
    mobile: overrides.mobile || '+1234567890',
    DOB: overrides.DOB || new Date('1990-01-01'),
    role: overrides.role || 'User',
    isConfirmed:
      overrides.isConfirmed !== undefined ? overrides.isConfirmed : true,
    ...overrides,
  };

  const user = await User.create(userData);
  return user;
};

/**
 * Create authenticated test user and return user with token
 */
export const createAuthUser = async (role = 'User', overrides = {}) => {
  const user = await createTestUser({ role, ...overrides });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  user.changeCredentialTime = Date.now();
  await user.save();

  // Reload to get updated user
  const updatedUser = await User.findById(user._id);

  return { user: updatedUser, accessToken, refreshToken };
};

/**
 * Create a test company
 */
export const createTestCompany = async (createdBy, overrides = {}) => {
  const companyData = {
    companyName: overrides.companyName || `Test Company ${Date.now()}`,
    companyEmail: overrides.companyEmail || `company${Date.now()}@example.com`,
    companyDescription: overrides.companyDescription || 'A test company',
    numberOfEmployees: overrides.numberOfEmployees || '11-20',
    companyLocation: overrides.companyLocation || 'Test City',
    legalAttachment: overrides.legalAttachment || {
      secure_url: 'https://example.com/legal.pdf',
      public_id: 'legal_123',
    },
    createdBy: createdBy._id || createdBy,
    approvedByAdmin:
      overrides.approvedByAdmin !== undefined
        ? overrides.approvedByAdmin
        : true,
    ...overrides,
  };

  const company = await Company.create(companyData);
  return company;
};

/**
 * Create a test job
 */
export const createTestJob = async (companyId, addedBy, overrides = {}) => {
  const jobData = {
    jobTitle: overrides.jobTitle || 'Software Engineer',
    jobLocation: overrides.jobLocation || 'Remote',
    workingTime: overrides.workingTime || 'Full-time',
    seniorityLevel: overrides.seniorityLevel || 'Mid-Level',
    jobDescription: overrides.jobDescription || 'Test job description',
    technicalSkills: overrides.technicalSkills || ['JavaScript', 'Node.js'],
    softSkills: overrides.softSkills || ['Communication', 'Teamwork'],
    companyId: companyId._id || companyId,
    addedBy: addedBy._id || addedBy,
    ...overrides,
  };

  const job = await Job.create(jobData);
  return job;
};

/**
 * Mock file for testing file uploads
 */
export const createMockFile = (
  filename = 'test.jpg',
  mimetype = 'image/jpeg',
) => {
  return {
    originalname: filename,
    mimetype: mimetype,
    buffer: Buffer.from('fake file content'),
    size: 1024,
  };
};

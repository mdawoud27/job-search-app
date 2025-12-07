import { jest } from '@jest/globals';
import { AdminService } from '../../src/services/admin.service.js';

let adminService;
let mockUserDao;
let mockAdminDao;
let mockCompanyDao;

beforeEach(() => {
  mockUserDao = {
    findById: jest.fn(),
  };

  mockAdminDao = {
    banUser: jest.fn(),
    unbanUser: jest.fn(),
    banCompany: jest.fn(),
    unbanCompany: jest.fn(),
    approveCompany: jest.fn(),
  };

  mockCompanyDao = {
    findById: jest.fn(),
  };

  adminService = new AdminService(mockUserDao, mockAdminDao, mockCompanyDao);

  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Helper function to create mock user
 */
const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  email: 'user@example.com',
  bannedAt: null,
  updatedAt: new Date(),
  updatedBy: null,
  ...overrides,
});

/**
 * Helper function to create mock company
 */
const createMockCompany = (overrides = {}) => ({
  _id: 'company_123',
  companyName: 'Test Company',
  bannedAt: null,
  approvedByAdmin: false,
  updatedAt: new Date(),
  updatedBy: null,
  ...overrides,
});

/**
 * Helper function to create mock admin
 */
const createMockAdmin = (overrides = {}) => ({
  id: 'admin_123',
  email: 'admin@example.com',
  ...overrides,
});

/**
 * Ban User tests
 */
describe('banUser', () => {
  it('should ban user successfully', async () => {
    const userId = 'user_123';
    const admin = createMockAdmin();
    const mockUser = createMockUser();
    mockUserDao.findById.mockResolvedValue(mockUser);
    mockAdminDao.banUser.mockResolvedValue({
      ...mockUser,
      bannedAt: new Date(),
      updatedBy: admin.id,
    });

    const result = await adminService.banUser(userId, admin);

    expect(mockUserDao.findById).toHaveBeenCalledWith(userId);
    expect(mockAdminDao.banUser).toHaveBeenCalledWith(userId, admin.id);
    expect(result.message).toBe('User banned successfully');
    expect(result.date.email).toBe(mockUser.email);
    expect(result.date.bannedBy).toBe(admin.email);
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    const admin = createMockAdmin();
    mockUserDao.findById.mockResolvedValue(null);

    await expect(adminService.banUser(userId, admin)).rejects.toThrow(
      'User not found',
    );
    expect(mockAdminDao.banUser).not.toHaveBeenCalled();
  });

  it('should throw error when user is already banned', async () => {
    const userId = 'user_123';
    const admin = createMockAdmin();
    const mockUser = createMockUser({ bannedAt: new Date() });
    mockUserDao.findById.mockResolvedValue(mockUser);

    await expect(adminService.banUser(userId, admin)).rejects.toThrow(
      'User is already banned',
    );
    expect(mockAdminDao.banUser).not.toHaveBeenCalled();
  });
});

/**
 * Unban User tests
 */
describe('unbanUser', () => {
  it('should unban user successfully', async () => {
    const userId = 'user_123';
    const admin = createMockAdmin();
    const mockUser = createMockUser({ bannedAt: new Date() });
    mockUserDao.findById.mockResolvedValue(mockUser);
    mockAdminDao.unbanUser.mockResolvedValue({
      ...mockUser,
      bannedAt: null,
      updatedBy: admin.id,
    });

    const result = await adminService.unbanUser(userId, admin);

    expect(mockUserDao.findById).toHaveBeenCalledWith(userId);
    expect(mockAdminDao.unbanUser).toHaveBeenCalledWith(userId, admin.id);
    expect(result.message).toBe('User unbanned successfully');
    expect(result.date.email).toBe(mockUser.email);
    expect(result.date.unbannedBy).toBe(admin.email);
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    const admin = createMockAdmin();
    mockUserDao.findById.mockResolvedValue(null);

    await expect(adminService.unbanUser(userId, admin)).rejects.toThrow(
      'User not found',
    );
    expect(mockAdminDao.unbanUser).not.toHaveBeenCalled();
  });

  it('should throw error when user is already unbanned', async () => {
    const userId = 'user_123';
    const admin = createMockAdmin();
    const mockUser = createMockUser({ bannedAt: null });
    mockUserDao.findById.mockResolvedValue(mockUser);

    await expect(adminService.unbanUser(userId, admin)).rejects.toThrow(
      'User is already unbanned',
    );
    expect(mockAdminDao.unbanUser).not.toHaveBeenCalled();
  });
});

/**
 * Ban Company tests
 */
describe('banCompany', () => {
  it('should ban company successfully', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({ approvedByAdmin: true });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);
    mockAdminDao.banCompany.mockResolvedValue({
      ...mockCompany,
      bannedAt: new Date(),
      updatedBy: admin.id,
    });

    const result = await adminService.banCompany(companyId, admin);

    expect(mockCompanyDao.findById).toHaveBeenCalledWith(companyId);
    expect(mockAdminDao.banCompany).toHaveBeenCalledWith(companyId, admin.id);
    expect(result.message).toBe('Company banned successfully');
    expect(result.date.name).toBe(mockCompany.companyName);
    expect(result.date.bannedBy).toBe(admin.email);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    mockCompanyDao.findById.mockResolvedValue(null);

    await expect(adminService.banCompany(companyId, admin)).rejects.toThrow(
      'Company not found or inactive',
    );
    expect(mockAdminDao.banCompany).not.toHaveBeenCalled();
  });

  it('should throw error when company is already banned', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({
      bannedAt: new Date(),
      approvedByAdmin: true,
    });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);

    await expect(adminService.banCompany(companyId, admin)).rejects.toThrow(
      'Company is already banned',
    );
    expect(mockAdminDao.banCompany).not.toHaveBeenCalled();
  });

  it('should throw error when company is not approved yet', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({ approvedByAdmin: false });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);

    await expect(adminService.banCompany(companyId, admin)).rejects.toThrow(
      'Company is not approved yet',
    );
    expect(mockAdminDao.banCompany).not.toHaveBeenCalled();
  });
});

/**
 * Unban Company tests
 */
describe('unbanCompany', () => {
  it('should unban company successfully', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({ bannedAt: new Date() });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);
    mockAdminDao.unbanCompany.mockResolvedValue({
      ...mockCompany,
      bannedAt: null,
      updatedBy: admin.id,
    });

    const result = await adminService.unbanCompany(companyId, admin);

    expect(mockCompanyDao.findById).toHaveBeenCalledWith(companyId);
    expect(mockAdminDao.unbanCompany).toHaveBeenCalledWith(companyId, admin.id);
    expect(result.message).toBe('Company unbanned successfully');
    expect(result.date.name).toBe(mockCompany.companyName);
    expect(result.date.unbannedBy).toBe(admin.email);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    mockCompanyDao.findById.mockResolvedValue(null);

    await expect(adminService.unbanCompany(companyId, admin)).rejects.toThrow(
      'Company not found or inactive',
    );
    expect(mockAdminDao.unbanCompany).not.toHaveBeenCalled();
  });

  it('should throw error when company is already unbanned', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({ bannedAt: null });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);

    await expect(adminService.unbanCompany(companyId, admin)).rejects.toThrow(
      'Company is already unbanned',
    );
    expect(mockAdminDao.unbanCompany).not.toHaveBeenCalled();
  });
});

/**
 * Approve Company tests
 */
describe('approveCompany', () => {
  it('should approve company successfully', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({ approvedByAdmin: false });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);
    mockAdminDao.approveCompany.mockResolvedValue({
      ...mockCompany,
      approvedByAdmin: true,
      updatedBy: admin.id,
    });

    const result = await adminService.approveCompany(companyId, admin);

    expect(mockCompanyDao.findById).toHaveBeenCalledWith(companyId);
    expect(mockAdminDao.approveCompany).toHaveBeenCalledWith(
      companyId,
      admin.id,
    );
    expect(result.message).toBe('Company approved successfully');
    expect(result.date.name).toBe(mockCompany.companyName);
    expect(result.date.approvedBy).toBe(admin.email);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    mockCompanyDao.findById.mockResolvedValue(null);

    await expect(adminService.approveCompany(companyId, admin)).rejects.toThrow(
      'Company not found or inactive',
    );
    expect(mockAdminDao.approveCompany).not.toHaveBeenCalled();
  });

  it('should throw error when company is already approved', async () => {
    const companyId = 'company_123';
    const admin = createMockAdmin();
    const mockCompany = createMockCompany({ approvedByAdmin: true });
    mockCompanyDao.findById.mockResolvedValue(mockCompany);

    await expect(adminService.approveCompany(companyId, admin)).rejects.toThrow(
      'Company is already approved',
    );
    expect(mockAdminDao.approveCompany).not.toHaveBeenCalled();
  });
});

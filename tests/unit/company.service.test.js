import { jest } from '@jest/globals';
import { CompanyService } from '../../src/services/company.service.js';
import * as CompanyResponseDtoModule from '../../src/dtos/company/company-response.dto.js';
import * as CloudinaryUtilsModule from '../../src/utils/cloudinary.util.js';
import { MSG } from '../../src/utils/messages.js';

let companyService;
let mockUserDao;
let mockCompanyDao;
let dtoSpies = {};
let cloudinarySpies = {};

beforeEach(() => {
  mockUserDao = {
    findByIdAndActive: jest.fn(),
  };

  mockCompanyDao = {
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findByIdWithJobs: jest.fn(),
    findByCompanyName: jest.fn(),
    isActive: jest.fn(),
    isOwner: jest.fn(),
    updateCompanyLogo: jest.fn(),
    updateCompanyCover: jest.fn(),
    addHR: jest.fn(),
    removeHR: jest.fn(),
  };

  companyService = new CompanyService(mockUserDao, mockCompanyDao);

  dtoSpies = {
    companyResponse: jest
      .spyOn(CompanyResponseDtoModule.CompanyResponseDto, 'toResponse')
      .mockImplementation(() => {}),
  };

  cloudinarySpies = {
    deleteFile: jest
      .spyOn(CloudinaryUtilsModule.CloudinaryUtils, 'deleteCloudinaryFile')
      .mockImplementation(() => {}),
  };

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
  role: 'HR',
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Helper function to create mock company
 */
const createMockCompany = (overrides = {}) => ({
  _id: 'company_123',
  companyName: 'Test Company',
  email: 'company@example.com',
  deletedAt: null,
  bannedAt: null,
  approvedByAdmin: true,
  logo: null,
  coverPic: null,
  createdBy: { _id: 'user_123', email: 'user@example.com', role: 'HR' },
  jobs: [],
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Create Company tests
 */
describe('createCompany', () => {
  it('should create company successfully', async () => {
    const dto = {
      companyName: 'Test Company',
      email: 'company@example.com',
    };
    const userId = 'user_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.create.mockResolvedValue(mockCompany);
    dtoSpies.companyResponse.mockReturnValue({
      id: 'company_123',
      companyName: 'Test Company',
    });

    const result = await companyService.createCompany(dto, userId);

    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.create).toHaveBeenCalledWith(dto, userId);
    expect(result.message).toBe(MSG.COMPANY.CREATED);
    expect(result.createdBy).toBe(mockUser.email);
    expect(result.role).toBe(mockUser.role);
  });

  it('should throw error when duplicate company email', async () => {
    const dto = {
      companyName: 'Test Company',
      email: 'duplicate@example.com',
    };
    const userId = 'user_123';
    const mockUser = createMockUser();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    const duplicateError = new Error('Duplicate key');
    duplicateError.code = 11000;
    duplicateError.keyPattern = { email: 1 };
    mockCompanyDao.create.mockRejectedValue(duplicateError);

    await expect(companyService.createCompany(dto, userId)).rejects.toThrow(
      MSG.COMPANY.ALREADY_EXISTS,
    );
  });

  it('should throw error when user not found or not active', async () => {
    const dto = {
      companyName: 'Test Company',
      email: 'company@example.com',
    };
    const userId = 'user_123';

    mockUserDao.findByIdAndActive.mockRejectedValue(
      new Error('User not found'),
    );

    await expect(companyService.createCompany(dto, userId)).rejects.toThrow(
      MSG.USER.NOT_FOUND,
    );
    expect(mockCompanyDao.create).not.toHaveBeenCalled();
  });
});

/**
 * Update Company tests
 */
describe('updateCompany', () => {
  it('should update company successfully', async () => {
    const companyId = 'company_123';
    const dto = { companyName: 'Updated Company' };
    const userId = 'user_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany({ companyName: 'Updated Company' });

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.update.mockResolvedValue(mockCompany);
    dtoSpies.companyResponse.mockReturnValue({
      id: 'company_123',
      companyName: 'Updated Company',
    });

    const result = await companyService.updateCompany(companyId, dto, userId);

    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.update).toHaveBeenCalledWith(companyId, dto, userId);
    expect(result.message).toBe(MSG.COMPANY.UPDATED);
  });

  it('should throw error when trying to update legalAttachment', async () => {
    const companyId = 'company_123';
    const dto = { legalAttachment: 'new_attachment' };
    const userId = 'user_123';

    await expect(
      companyService.updateCompany(companyId, dto, userId),
    ).rejects.toThrow(MSG.COMPANY.LEGAL_ATTACHMENT_NOT_ALLOWED);
    expect(mockUserDao.findByIdAndActive).not.toHaveBeenCalled();
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const dto = { companyName: 'Updated Company' };
    const userId = 'user_123';
    const mockUser = createMockUser();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.update.mockResolvedValue(null);

    await expect(
      companyService.updateCompany(companyId, dto, userId),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });

  it('should throw error when company is deleted or banned', async () => {
    const companyId = 'company_123';
    const dto = { companyName: 'Updated Company' };
    const userId = 'user_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany({ deletedAt: new Date() });

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.update.mockResolvedValue(mockCompany);

    await expect(
      companyService.updateCompany(companyId, dto, userId),
    ).rejects.toThrow(MSG.COMPANY.DELETED_OR_BANNED);
  });

  it('should handle duplicate key error', async () => {
    const companyId = 'company_123';
    const dto = { email: 'duplicate@example.com' };
    const userId = 'user_123';
    const mockUser = createMockUser();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    const duplicateError = new Error('Duplicate key');
    duplicateError.code = 11000;
    duplicateError.keyPattern = { email: 1 };
    mockCompanyDao.update.mockRejectedValue(duplicateError);

    await expect(
      companyService.updateCompany(companyId, dto, userId),
    ).rejects.toThrow('email already exists');
  });
});

/**
 * Soft Delete Company tests
 */
describe('softDeleteCompany', () => {
  it('should soft delete company successfully', async () => {
    const companyId = 'company_123';
    const owner = { id: 'user_123', email: 'user@example.com', role: 'HR' };
    const mockUser = createMockUser();
    const mockCompany = createMockCompany({ deletedAt: new Date() });

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.softDelete.mockResolvedValue(mockCompany);
    dtoSpies.companyResponse.mockReturnValue({
      id: 'company_123',
      companyName: 'Test Company',
    });

    const result = await companyService.softDeleteCompany(companyId, owner);

    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(owner.id);
    expect(mockCompanyDao.softDelete).toHaveBeenCalledWith(companyId, owner);
    expect(result.message).toBe('Company deleted successfully');
  });

  it('should throw error when user not found', async () => {
    const companyId = 'company_123';
    const owner = { id: 'user_123', email: 'user@example.com' };

    mockUserDao.findByIdAndActive.mockRejectedValue(
      new Error('User not found'),
    );

    await expect(
      companyService.softDeleteCompany(companyId, owner),
    ).rejects.toThrow('User not found');
    expect(mockCompanyDao.softDelete).not.toHaveBeenCalled();
  });
});

/**
 * Get Specific Company With Jobs tests
 */
describe('getSpecificCompanyWithJobs', () => {
  it('should get company with jobs successfully', async () => {
    const companyId = 'company_123';
    const mockCompany = createMockCompany({
      jobs: [{ _id: 'job_1', title: 'Developer' }],
    });

    mockCompanyDao.findByIdWithJobs.mockResolvedValue(mockCompany);
    dtoSpies.companyResponse.mockReturnValue({
      id: 'company_123',
      companyName: 'Test Company',
    });

    const result = await companyService.getSpecificCompanyWithJobs(companyId);

    expect(mockCompanyDao.findByIdWithJobs).toHaveBeenCalledWith(companyId);
    expect(result.message).toBe('Company found successfully');
    expect(result.data.jobs).toBeDefined();
    expect(result.createdBy).toBe(mockCompany.createdBy.email);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';

    mockCompanyDao.findByIdWithJobs.mockResolvedValue(null);

    await expect(
      companyService.getSpecificCompanyWithJobs(companyId),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });
});

/**
 * Search Company With Name tests
 */
describe('searchCompanywithName', () => {
  it('should search companies by name successfully', async () => {
    const companyName = 'Test';
    const mockCompanies = [
      createMockCompany({ companyName: 'Test Company 1' }),
      createMockCompany({ companyName: 'Test Company 2' }),
    ];

    mockCompanyDao.findByCompanyName.mockResolvedValue(mockCompanies);
    dtoSpies.companyResponse.mockReturnValue({
      id: 'company_123',
      companyName: 'Test Company',
    });

    const result = await companyService.searchCompanywithName(companyName);

    expect(mockCompanyDao.findByCompanyName).toHaveBeenCalledWith(companyName);
    expect(result.message).toBe(MSG.COMPANY.ALL_FOUND);
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should throw error when no companies found', async () => {
    const companyName = 'Nonexistent';

    mockCompanyDao.findByCompanyName.mockResolvedValue([]);

    await expect(
      companyService.searchCompanywithName(companyName),
    ).rejects.toThrow(MSG.COMPANY.NO_COMPANIES_FOUND);
  });

  it('should throw error when companies is null', async () => {
    const companyName = 'Nonexistent';

    mockCompanyDao.findByCompanyName.mockResolvedValue(null);

    await expect(
      companyService.searchCompanywithName(companyName),
    ).rejects.toThrow(MSG.COMPANY.NO_COMPANIES_FOUND);
  });
});

/**
 * Upload Company Logo tests
 */
describe('uploadCompanyLogo', () => {
  it('should upload logo successfully', async () => {
    const companyId = 'company_123';
    const logo = { secure_url: 'logo.jpg', public_id: 'logo_id' };
    const mockUser = { id: 'user_123', role: 'HR' };
    const mockCompany = createMockCompany();
    const updatedCompany = createMockCompany({ logo });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.updateCompanyLogo.mockResolvedValue(updatedCompany);

    const result = await companyService.uploadCompanyLogo(
      companyId,
      logo,
      mockUser,
    );

    expect(mockCompanyDao.isOwner).toHaveBeenCalledWith(companyId, mockUser.id);
    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockCompanyDao.updateCompanyLogo).toHaveBeenCalledWith(
      companyId,
      logo,
    );
    expect(result.message).toBe(MSG.COMPANY.LOGO_UPLOADED);
    expect(result.data.logo).toEqual(logo);
  });

  it('should delete old logo before uploading new one', async () => {
    const companyId = 'company_123';
    const logo = { secure_url: 'new_logo.jpg', public_id: 'new_logo_id' };
    const mockCompany = createMockCompany({
      logo: { secure_url: 'old_logo.jpg', public_id: 'old_logo_id' },
    });
    const updatedCompany = createMockCompany({ logo });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.updateCompanyLogo.mockResolvedValue(updatedCompany);

    const result = await companyService.uploadCompanyLogo(companyId, logo, {
      id: 'user_123',
      role: 'HR',
    });

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('old_logo_id');
    expect(result.message).toBe(MSG.COMPANY.LOGO_UPLOADED);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const logo = { secure_url: 'logo.jpg', public_id: 'logo_id' };

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(null);

    await expect(
      companyService.uploadCompanyLogo(companyId, logo, {
        id: 'user_123',
        role: 'HR',
      }),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND_OR_BANNED);
  });
});

/**
 * Delete Company Logo tests
 */
describe('deleteCompanyLogo', () => {
  it('should delete logo successfully', async () => {
    const companyId = 'company_123';
    const mockCompany = createMockCompany({
      logo: { secure_url: 'logo.jpg', public_id: 'logo_id' },
    });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    cloudinarySpies.deleteFile.mockResolvedValue(true);

    const result = await companyService.deleteCompanyLogo(companyId, {
      id: 'user_123',
      role: 'HR',
    });

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('logo_id');
    expect(mockCompany.logo).toBeNull();
    expect(mockCompany.save).toHaveBeenCalled();
    expect(result.message).toBe(MSG.COMPANY.LOGO_DELETED);
  });

  it('should return message when no logo to delete', async () => {
    const companyId = 'company_123';
    const mockCompany = createMockCompany({ logo: null });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);

    const result = await companyService.deleteCompanyLogo(companyId, {
      id: 'user_123',
      role: 'HR',
    });

    expect(cloudinarySpies.deleteFile).not.toHaveBeenCalled();
    expect(mockCompany.save).not.toHaveBeenCalled();
    expect(result.message).toBe(MSG.COMPANY.NO_LOGO);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(null);

    await expect(
      companyService.deleteCompanyLogo(companyId, {
        id: 'user_123',
        role: 'HR',
      }),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });
});

/**
 * Upload Company Cover tests
 */
describe('uploadCompanyCover', () => {
  it('should upload cover successfully', async () => {
    const companyId = 'company_123';
    const cover = { secure_url: 'cover.jpg', public_id: 'cover_id' };
    const mockCompany = createMockCompany();
    const updatedCompany = createMockCompany({ coverPic: cover });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.updateCompanyCover.mockResolvedValue(updatedCompany);

    const result = await companyService.uploadCompanyCover(companyId, cover, {
      id: 'user_123',
      role: 'HR',
    });

    expect(mockCompanyDao.isOwner).toHaveBeenCalledWith(companyId, 'user_123');
    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockCompanyDao.updateCompanyCover).toHaveBeenCalledWith(
      companyId,
      cover,
    );
    expect(result.message).toBe(MSG.COMPANY.COVER_UPLOADED);
    expect(result.data.coverPic).toEqual(cover);
  });

  it('should delete old cover before uploading new one', async () => {
    const companyId = 'company_123';
    const cover = { secure_url: 'new_cover.jpg', public_id: 'new_cover_id' };
    const mockCompany = createMockCompany({
      coverPic: { secure_url: 'old_cover.jpg', public_id: 'old_cover_id' },
    });
    const updatedCompany = createMockCompany({ coverPic: cover });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.updateCompanyCover.mockResolvedValue(updatedCompany);

    const result = await companyService.uploadCompanyCover(companyId, cover, {
      id: 'user_123',
      role: 'HR',
    });

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('old_cover_id');
    expect(result.message).toBe(MSG.COMPANY.COVER_UPLOADED);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const cover = { secure_url: 'cover.jpg', public_id: 'cover_id' };

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(null);

    await expect(
      companyService.uploadCompanyCover(companyId, cover, {
        id: 'user_123',
        role: 'HR',
      }),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });
});

/**
 * Delete Company Cover tests
 */
describe('deleteCompanyCover', () => {
  it('should delete cover successfully', async () => {
    const companyId = 'company_123';
    const mockCompany = createMockCompany({
      coverPic: { secure_url: 'cover.jpg', public_id: 'cover_id' },
    });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    cloudinarySpies.deleteFile.mockResolvedValue(true);

    const result = await companyService.deleteCompanyCover(companyId, {
      id: 'user_123',
      role: 'HR',
    });

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('cover_id');
    expect(mockCompany.coverPic).toBeNull();
    expect(mockCompany.save).toHaveBeenCalled();
    expect(result.message).toBe(MSG.COMPANY.COVER_DELETED);
  });

  it('should return message when no cover to delete', async () => {
    const companyId = 'company_123';
    const mockCompany = createMockCompany({ coverPic: null });

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);

    const result = await companyService.deleteCompanyCover(companyId, {
      id: 'user_123',
      role: 'HR',
    });

    expect(cloudinarySpies.deleteFile).not.toHaveBeenCalled();
    expect(mockCompany.save).not.toHaveBeenCalled();
    expect(result.message).toBe(MSG.COMPANY.NO_COVER);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';

    mockCompanyDao.isOwner.mockResolvedValue(true);
    mockCompanyDao.isActive.mockResolvedValue(null);

    await expect(
      companyService.deleteCompanyCover(companyId, {
        id: 'user_123',
        role: 'HR',
      }),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });
});

/**
 * Add HR tests
 */
describe('addHR', () => {
  it('should add HR successfully', async () => {
    const companyId = 'company_123';
    const userId = 'user_123';
    const mockCompany = createMockCompany();
    const mockUser = createMockUser({ role: 'User' });
    const updatedCompany = createMockCompany({ HRs: [userId] });

    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.addHR.mockResolvedValue(updatedCompany);

    const result = await companyService.addHR(companyId, userId, {
      id: 'user_123',
      role: 'HR',
    });

    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.addHR).toHaveBeenCalledWith(companyId, userId);
    expect(mockUser.role).toBe('HR');
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe(MSG.COMPANY.HR_ADDED);
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const userId = 'user_123';

    mockCompanyDao.isActive.mockResolvedValue(null);

    await expect(
      companyService.addHR(companyId, userId, { id: 'user_123', role: 'HR' }),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });

  it('should throw error when user not found', async () => {
    const companyId = 'company_123';
    const userId = 'user_123';
    const mockCompany = createMockCompany();

    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockUserDao.findByIdAndActive.mockRejectedValue(
      new Error(MSG.USER.NOT_FOUND),
    );

    await expect(
      companyService.addHR(companyId, userId, { id: 'user_123', role: 'HR' }),
    ).rejects.toThrow(MSG.USER.NOT_FOUND);
  });
});

/**
 * Remove HR tests
 */
describe('removeHR', () => {
  it('should remove HR successfully', async () => {
    const companyId = 'company_123';
    const userId = 'user_123';
    const mockCompany = createMockCompany();
    const mockUser = createMockUser({ role: 'HR' });
    const updatedCompany = createMockCompany({ HRs: [] });

    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.removeHR.mockResolvedValue(updatedCompany);

    const result = await companyService.removeHR(companyId, userId, {
      id: 'user_123',
      role: 'HR',
    });

    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.removeHR).toHaveBeenCalledWith(companyId, userId);
    expect(result.message).toBe('HR removed successfully');
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const userId = 'user_123';

    mockCompanyDao.isActive.mockResolvedValue(null);

    await expect(
      companyService.removeHR(companyId, userId, {
        id: 'user_123',
        role: 'HR',
      }),
    ).rejects.toThrow(MSG.COMPANY.NOT_FOUND);
  });

  it('should throw error when user not found', async () => {
    const companyId = 'company_123';
    const userId = 'user_123';
    const mockCompany = createMockCompany();

    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockUserDao.findByIdAndActive.mockRejectedValue(
      new Error(MSG.USER.NOT_FOUND),
    );

    await expect(
      companyService.removeHR(companyId, userId, {
        id: 'user_123',
        role: 'HR',
      }),
    ).rejects.toThrow(MSG.USER.NOT_FOUND);
  });
});

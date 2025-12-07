import { jest } from '@jest/globals';
import { ApplicationService } from '../../src/services/application.service.js';
import * as SocketModule from '../../src/config/socket.js';
import * as EmailUtilsModule from '../../src/utils/email.utils.js';
import * as ExcelUtilsModule from '../../src/utils/excel.utils.js';

let applicationService;
let mockUserRepository;
let mockJobRepository;
let mockApplicationRepository;
let mockCompanyRepository;
let socketSpies = {};
let emailSpies = {};
let excelSpies = {};

beforeEach(() => {
  mockUserRepository = {
    findByIdAndActive: jest.fn(),
    findById: jest.fn(),
  };

  mockJobRepository = {
    findById: jest.fn(),
    findByIdWithApplications: jest.fn(),
  };

  mockApplicationRepository = {
    createApplication: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    countApplications: jest.fn(),
    findByCompanyAndDate: jest.fn(),
  };

  mockCompanyRepository = {
    canManage: jest.fn(),
    findById: jest.fn(),
  };

  applicationService = new ApplicationService(
    mockUserRepository,
    mockJobRepository,
    mockApplicationRepository,
    mockCompanyRepository,
  );

  // Mock socket.io
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };
  socketSpies = {
    getIO: jest.spyOn(SocketModule, 'getIO').mockReturnValue(mockIo),
  };

  emailSpies = {
    sendAcceptanceEmail: jest
      .spyOn(EmailUtilsModule, 'sendAcceptanceEmail')
      .mockResolvedValue(true),
    sendRejectionEmail: jest
      .spyOn(EmailUtilsModule, 'sendRejectionEmail')
      .mockResolvedValue(true),
  };

  excelSpies = {
    generateApplicationsExcel: jest
      .spyOn(ExcelUtilsModule, 'generateApplicationsExcel')
      .mockResolvedValue(Buffer.from('excel data')),
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
  firstName: 'John',
  lastName: 'Doe',
  ...overrides,
});

/**
 * Helper function to create mock job
 */
const createMockJob = (overrides = {}) => ({
  _id: 'job_123',
  jobTitle: 'Software Engineer',
  companyId: 'company_123',
  isVisible: true,
  closed: false,
  ...overrides,
});

/**
 * Helper function to create mock application
 */
const createMockApplication = (overrides = {}) => ({
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

/**
 * Helper function to create mock company
 */
const createMockCompany = (overrides = {}) => ({
  _id: 'company_123',
  companyName: 'Test Company',
  companyEmail: 'company@example.com',
  ...overrides,
});

/**
 * Create Application tests
 */
describe('createApplication', () => {
  it('should create application successfully', async () => {
    const userId = 'user_123';
    const jobId = 'job_123';
    const cv = { secure_url: 'cv.pdf', public_id: 'cv_id' };
    const mockUser = createMockUser();
    const mockJob = createMockJob();
    const mockApplication = createMockApplication();

    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockApplicationRepository.createApplication.mockResolvedValue(
      mockApplication,
    );

    const result = await applicationService.createApplication(
      userId,
      jobId,
      cv,
    );

    expect(mockUserRepository.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
    expect(mockApplicationRepository.createApplication).toHaveBeenCalledWith(
      userId,
      jobId,
      cv,
    );
    expect(result.message).toBe('Application created successfully');
    expect(result.data.user).toBe(mockUser.email);
    expect(result.data.job).toBe(mockJob.jobTitle);
  });

  it('should emit socket event when application is created', async () => {
    const userId = 'user_123';
    const jobId = 'job_123';
    const cv = { secure_url: 'cv.pdf', public_id: 'cv_id' };
    const mockUser = createMockUser();
    const mockJob = createMockJob();
    const mockApplication = createMockApplication();

    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockApplicationRepository.createApplication.mockResolvedValue(
      mockApplication,
    );

    await applicationService.createApplication(userId, jobId, cv);

    const mockIo = socketSpies.getIO();
    expect(mockIo.to).toHaveBeenCalledWith(`company:${mockJob.companyId}`);
    expect(mockIo.emit).toHaveBeenCalledWith(
      'newApplication',
      expect.objectContaining({
        jobId: mockJob._id,
        applicationId: mockApplication._id,
        userName: `${mockUser.firstName} ${mockUser.lastName}`,
      }),
    );
  });

  it('should throw error when job not found', async () => {
    const userId = 'user_123';
    const jobId = 'job_123';
    const cv = { secure_url: 'cv.pdf', public_id: 'cv_id' };
    const mockUser = createMockUser();

    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    mockJobRepository.findById.mockResolvedValue(null);

    await expect(
      applicationService.createApplication(userId, jobId, cv),
    ).rejects.toThrow('Job not found');
    expect(mockApplicationRepository.createApplication).not.toHaveBeenCalled();
  });

  it('should handle socket error gracefully', async () => {
    const userId = 'user_123';
    const jobId = 'job_123';
    const cv = { secure_url: 'cv.pdf', public_id: 'cv_id' };
    const mockUser = createMockUser();
    const mockJob = createMockJob();
    const mockApplication = createMockApplication();

    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockApplicationRepository.createApplication.mockResolvedValue(
      mockApplication,
    );
    socketSpies.getIO.mockImplementation(() => {
      throw new Error('Socket connection failed');
    });

    // Should not throw error even if socket fails
    const result = await applicationService.createApplication(
      userId,
      jobId,
      cv,
    );

    expect(result.message).toBe('Application created successfully');
  });
});

/**
 * Get All Applications For Specific Job tests
 */
describe('getAllApplicationsForSpecificJob', () => {
  it('should get applications with default pagination', async () => {
    const jobId = 'job_123';
    const userId = 'user_123';
    const query = {};
    const mockJob = createMockJob();
    const mockJobWithApplications = {
      ...mockJob,
      jobApplications: [createMockApplication()],
    };

    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockJobRepository.findByIdWithApplications.mockResolvedValue(
      mockJobWithApplications,
    );
    mockApplicationRepository.countApplications.mockResolvedValue(1);

    const result = await applicationService.getAllApplicationsForSpecificJob(
      jobId,
      userId,
      query,
    );

    expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
    expect(mockCompanyRepository.canManage).toHaveBeenCalledWith(
      mockJob.companyId,
      userId,
    );
    expect(result.message).toBe('Applications retrieved successfully');
    expect(result.data.applications).toHaveLength(1);
    expect(result.data.pagination.total).toBe(1);
    expect(result.data.pagination.page).toBe(1);
  });

  it('should handle pagination correctly', async () => {
    const jobId = 'job_123';
    const userId = 'user_123';
    const query = { page: '2', limit: '5' };
    const mockJob = createMockJob();
    const mockJobWithApplications = {
      ...mockJob,
      jobApplications: [createMockApplication()],
    };

    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockJobRepository.findByIdWithApplications.mockResolvedValue(
      mockJobWithApplications,
    );
    mockApplicationRepository.countApplications.mockResolvedValue(12);

    const result = await applicationService.getAllApplicationsForSpecificJob(
      jobId,
      userId,
      query,
    );

    expect(mockJobRepository.findByIdWithApplications).toHaveBeenCalledWith(
      jobId,
      5,
      5,
      '-createdAt',
    );
    expect(result.data.pagination.page).toBe(2);
    expect(result.data.pagination.limit).toBe(5);
    expect(result.data.pagination.pages).toBe(3);
  });

  it('should throw error when job not found', async () => {
    const jobId = 'job_123';
    const userId = 'user_123';
    const query = {};

    mockJobRepository.findById.mockResolvedValue(null);

    await expect(
      applicationService.getAllApplicationsForSpecificJob(jobId, userId, query),
    ).rejects.toThrow('Job not found');
  });

  it('should throw error when user does not have permission', async () => {
    const jobId = 'job_123';
    const userId = 'user_123';
    const query = {};
    const mockJob = createMockJob();

    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockCompanyRepository.canManage.mockResolvedValue(false);

    await expect(
      applicationService.getAllApplicationsForSpecificJob(jobId, userId, query),
    ).rejects.toThrow(
      'You do not have permission to view applications for this job',
    );
  });

  it('should handle custom sorting', async () => {
    const jobId = 'job_123';
    const userId = 'user_123';
    const query = { sort: 'createdAt' };
    const mockJob = createMockJob();
    const mockJobWithApplications = {
      ...mockJob,
      jobApplications: [],
    };

    mockJobRepository.findById.mockResolvedValue(mockJob);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockJobRepository.findByIdWithApplications.mockResolvedValue(
      mockJobWithApplications,
    );
    mockApplicationRepository.countApplications.mockResolvedValue(0);

    await applicationService.getAllApplicationsForSpecificJob(
      jobId,
      userId,
      query,
    );

    expect(mockJobRepository.findByIdWithApplications).toHaveBeenCalledWith(
      jobId,
      0,
      10,
      'createdAt',
    );
  });
});

/**
 * Update Application Status tests
 */
describe('updateApplicationStatus', () => {
  it('should update status to accepted and send acceptance email', async () => {
    const applicationId = 'application_123';
    const status = 'accepted';
    const hrUserId = 'hr_123';
    const mockApplication = createMockApplication({
      userId: createMockUser(),
      jobId: { ...createMockJob(), companyId: 'company_123' },
    });
    const mockHrUser = createMockUser({
      _id: 'hr_123',
      email: 'hr@example.com',
    });
    const mockCompany = createMockCompany();
    const updatedApplication = { ...mockApplication, status: 'accepted' };

    mockApplicationRepository.findById.mockResolvedValue(mockApplication);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(mockHrUser);
    mockCompanyRepository.findById.mockResolvedValue(mockCompany);
    mockApplicationRepository.updateStatus.mockResolvedValue(
      updatedApplication,
    );

    const result = await applicationService.updateApplicationStatus(
      applicationId,
      status,
      hrUserId,
    );

    expect(mockApplicationRepository.findById).toHaveBeenCalledWith(
      applicationId,
    );
    expect(mockApplicationRepository.updateStatus).toHaveBeenCalledWith(
      applicationId,
      status,
    );
    expect(emailSpies.sendAcceptanceEmail).toHaveBeenCalledWith(
      mockCompany.companyEmail,
      mockApplication.userId.email,
      `${mockApplication.userId.firstName} ${mockApplication.userId.lastName}`,
      mockApplication.jobId.jobTitle,
      mockCompany.companyName,
    );
    expect(result.message).toBe('Application accepted successfully');
  });

  it('should update status to rejected and send rejection email', async () => {
    const applicationId = 'application_123';
    const status = 'rejected';
    const hrUserId = 'hr_123';
    const mockApplication = createMockApplication({
      userId: createMockUser(),
      jobId: { ...createMockJob(), companyId: 'company_123' },
    });
    const mockHrUser = createMockUser({ _id: 'hr_123' });
    const mockCompany = createMockCompany();
    const updatedApplication = { ...mockApplication, status: 'rejected' };

    mockApplicationRepository.findById.mockResolvedValue(mockApplication);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(mockHrUser);
    mockCompanyRepository.findById.mockResolvedValue(mockCompany);
    mockApplicationRepository.updateStatus.mockResolvedValue(
      updatedApplication,
    );

    const result = await applicationService.updateApplicationStatus(
      applicationId,
      status,
      hrUserId,
    );

    expect(emailSpies.sendRejectionEmail).toHaveBeenCalled();
    expect(result.message).toBe('Application rejected successfully');
  });

  it('should throw error when application not found', async () => {
    const applicationId = 'application_123';
    const status = 'accepted';
    const hrUserId = 'hr_123';

    mockApplicationRepository.findById.mockResolvedValue(null);

    await expect(
      applicationService.updateApplicationStatus(
        applicationId,
        status,
        hrUserId,
      ),
    ).rejects.toThrow('Application not found');
  });

  it('should throw error when user does not have permission', async () => {
    const applicationId = 'application_123';
    const status = 'accepted';
    const hrUserId = 'hr_123';
    const mockApplication = createMockApplication({
      userId: createMockUser(),
      jobId: { ...createMockJob(), companyId: 'company_123' },
    });

    mockApplicationRepository.findById.mockResolvedValue(mockApplication);
    mockCompanyRepository.canManage.mockResolvedValue(false);

    await expect(
      applicationService.updateApplicationStatus(
        applicationId,
        status,
        hrUserId,
      ),
    ).rejects.toThrow('You do not have permission to update this application');
  });

  it('should throw error when HR user not found', async () => {
    const applicationId = 'application_123';
    const status = 'accepted';
    const hrUserId = 'hr_123';
    const mockApplication = createMockApplication({
      userId: createMockUser(),
      jobId: { ...createMockJob(), companyId: 'company_123' },
    });

    mockApplicationRepository.findById.mockResolvedValue(mockApplication);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      applicationService.updateApplicationStatus(
        applicationId,
        status,
        hrUserId,
      ),
    ).rejects.toThrow('HR user not found');
  });

  it('should throw error when company not found', async () => {
    const applicationId = 'application_123';
    const status = 'accepted';
    const hrUserId = 'hr_123';
    const mockApplication = createMockApplication({
      userId: createMockUser(),
      jobId: { ...createMockJob(), companyId: 'company_123' },
    });
    const mockHrUser = createMockUser({ _id: 'hr_123' });

    mockApplicationRepository.findById.mockResolvedValue(mockApplication);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(mockHrUser);
    mockCompanyRepository.findById.mockResolvedValue(null);

    await expect(
      applicationService.updateApplicationStatus(
        applicationId,
        status,
        hrUserId,
      ),
    ).rejects.toThrow('Company not found');
  });

  it('should handle email sending errors gracefully', async () => {
    const applicationId = 'application_123';
    const status = 'accepted';
    const hrUserId = 'hr_123';
    const mockApplication = createMockApplication({
      userId: createMockUser(),
      jobId: { ...createMockJob(), companyId: 'company_123' },
    });
    const mockHrUser = createMockUser({ _id: 'hr_123' });
    const mockCompany = createMockCompany();
    const updatedApplication = { ...mockApplication, status: 'accepted' };

    mockApplicationRepository.findById.mockResolvedValue(mockApplication);
    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(mockHrUser);
    mockCompanyRepository.findById.mockResolvedValue(mockCompany);
    mockApplicationRepository.updateStatus.mockResolvedValue(
      updatedApplication,
    );
    emailSpies.sendAcceptanceEmail.mockRejectedValue(
      new Error('Email service unavailable'),
    );

    // Should not throw error even if email fails
    const result = await applicationService.updateApplicationStatus(
      applicationId,
      status,
      hrUserId,
    );

    expect(result.message).toBe('Application accepted successfully');
  });
});

/**
 * Export Company Applications By Date tests
 */
describe('exportCompanyApplicationsByDate', () => {
  it('should export applications successfully', async () => {
    const companyId = 'company_123';
    const date = '2024-01-15';
    const hrUserId = 'hr_123';
    const mockCompany = createMockCompany();
    const mockApplications = [createMockApplication()];

    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockCompanyRepository.findById.mockResolvedValue(mockCompany);
    mockApplicationRepository.findByCompanyAndDate.mockResolvedValue(
      mockApplications,
    );

    const result = await applicationService.exportCompanyApplicationsByDate(
      companyId,
      date,
      hrUserId,
    );

    expect(mockCompanyRepository.canManage).toHaveBeenCalledWith(
      companyId,
      hrUserId,
    );
    expect(mockCompanyRepository.findById).toHaveBeenCalledWith(companyId);
    expect(excelSpies.generateApplicationsExcel).toHaveBeenCalledWith(
      mockApplications,
      mockCompany.companyName,
      date,
    );
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('Test_Company');
    expect(result.filename).toContain(date);
    expect(result.applications).toBe(1);
  });

  it('should throw error when user does not have permission', async () => {
    const companyId = 'company_123';
    const date = '2024-01-15';
    const hrUserId = 'hr_123';

    mockCompanyRepository.canManage.mockResolvedValue(false);

    await expect(
      applicationService.exportCompanyApplicationsByDate(
        companyId,
        date,
        hrUserId,
      ),
    ).rejects.toThrow(
      'You do not have permission to export applications for this company',
    );
  });

  it('should throw error when company not found', async () => {
    const companyId = 'company_123';
    const date = '2024-01-15';
    const hrUserId = 'hr_123';

    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockCompanyRepository.findById.mockResolvedValue(null);

    await expect(
      applicationService.exportCompanyApplicationsByDate(
        companyId,
        date,
        hrUserId,
      ),
    ).rejects.toThrow('Company not found');
  });

  it('should throw error for invalid date format', async () => {
    const companyId = 'company_123';
    const date = 'invalid-date';
    const hrUserId = 'hr_123';
    const mockCompany = createMockCompany();

    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockCompanyRepository.findById.mockResolvedValue(mockCompany);

    await expect(
      applicationService.exportCompanyApplicationsByDate(
        companyId,
        date,
        hrUserId,
      ),
    ).rejects.toThrow('Invalid date format. Please use YYYY-MM-DD');
  });

  it('should handle date range correctly', async () => {
    const companyId = 'company_123';
    const date = '2024-01-15';
    const hrUserId = 'hr_123';
    const mockCompany = createMockCompany();
    const mockApplications = [];

    mockCompanyRepository.canManage.mockResolvedValue(true);
    mockCompanyRepository.findById.mockResolvedValue(mockCompany);
    mockApplicationRepository.findByCompanyAndDate.mockResolvedValue(
      mockApplications,
    );

    await applicationService.exportCompanyApplicationsByDate(
      companyId,
      date,
      hrUserId,
    );

    const callArgs =
      mockApplicationRepository.findByCompanyAndDate.mock.calls[0];
    const startDate = callArgs[1];
    const endDate = callArgs[2];

    expect(startDate.getUTCHours()).toBe(0);
    expect(startDate.getUTCMinutes()).toBe(0);
    expect(endDate.getUTCHours()).toBe(23);
    expect(endDate.getUTCMinutes()).toBe(59);
  });
});

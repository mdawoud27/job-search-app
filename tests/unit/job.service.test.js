import { jest } from '@jest/globals';
import { JobService } from '../../src/services/job.service.js';
import * as JobResponseDtoModule from '../../src/dtos/job/job-response.dto.js';

let jobService;
let mockUserDao;
let mockCompanyDao;
let mockJobDao;
let dtoSpies = {};

beforeEach(() => {
  mockUserDao = {
    findByIdAndActive: jest.fn(),
  };

  mockCompanyDao = {
    isActive: jest.fn(),
    canManage: jest.fn(),
    findByCompanyName: jest.fn(),
  };

  mockJobDao = {
    createJob: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  jobService = new JobService(mockUserDao, mockCompanyDao, mockJobDao);

  dtoSpies = {
    jobResponse: jest
      .spyOn(JobResponseDtoModule.JobResponseDto, 'toResponse')
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
  id: 'user_123',
  _id: 'user_123',
  email: 'user@example.com',
  role: 'HR',
  ...overrides,
});

/**
 * Helper function to create mock company
 */
const createMockCompany = (overrides = {}) => ({
  id: 'company_123',
  _id: 'company_123',
  companyName: 'Test Company',
  ...overrides,
});

/**
 * Helper function to create mock job
 */
const createMockJob = (overrides = {}) => ({
  _id: 'job_123',
  jobTitle: 'Software Engineer',
  companyId: 'company_123',
  addedBy: 'user_123',
  isVisible: true,
  closed: false,
  ...overrides,
});

/**
 * Create Job tests
 */
describe('createJob', () => {
  it('should create job successfully', async () => {
    const dto = { jobTitle: 'Software Engineer', jobLocation: 'Remote' };
    const userId = 'user_123';
    const companyId = 'company_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();
    const mockJob = createMockJob();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(true);
    mockJobDao.createJob.mockResolvedValue(mockJob);
    dtoSpies.jobResponse.mockReturnValue({
      id: 'job_123',
      jobTitle: 'Software Engineer',
    });

    const result = await jobService.createJob(dto, userId, companyId);

    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockCompanyDao.canManage).toHaveBeenCalledWith(companyId, userId);
    expect(mockJobDao.createJob).toHaveBeenCalledWith(
      dto,
      mockUser.id,
      mockCompany.id,
    );
    expect(result.message).toBe('Job created successfully');
    expect(result.data.companyName).toBe(mockCompany.companyName);
  });

  it('should throw error when user does not have permission', async () => {
    const dto = { jobTitle: 'Software Engineer' };
    const userId = 'user_123';
    const companyId = 'company_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(false);

    await expect(jobService.createJob(dto, userId, companyId)).rejects.toThrow(
      'You do not have permission to create a job in this company',
    );
    expect(mockJobDao.createJob).not.toHaveBeenCalled();
  });

  it('should throw error when user not found or not active', async () => {
    const dto = { jobTitle: 'Software Engineer' };
    const userId = 'user_123';
    const companyId = 'company_123';

    mockUserDao.findByIdAndActive.mockRejectedValue(
      new Error('User not found'),
    );

    await expect(jobService.createJob(dto, userId, companyId)).rejects.toThrow(
      'User not found',
    );
    expect(mockJobDao.createJob).not.toHaveBeenCalled();
  });

  it('should throw error when company not found or not active', async () => {
    const dto = { jobTitle: 'Software Engineer' };
    const userId = 'user_123';
    const companyId = 'company_123';
    const mockUser = createMockUser();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockRejectedValue(
      new Error('Company not found or inactive'),
    );

    await expect(jobService.createJob(dto, userId, companyId)).rejects.toThrow(
      'Company not found or inactive',
    );
    expect(mockJobDao.createJob).not.toHaveBeenCalled();
  });
});

/**
 * Update Job tests
 */
describe('updateJob', () => {
  it('should update job successfully', async () => {
    const dto = { jobTitle: 'Senior Software Engineer' };
    const userId = 'user_123';
    const companyId = 'company_123';
    const jobId = 'job_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();
    const mockJob = createMockJob({ jobTitle: 'Senior Software Engineer' });

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(true);
    mockJobDao.updateJob.mockResolvedValue(mockJob);
    dtoSpies.jobResponse.mockReturnValue({
      id: 'job_123',
      jobTitle: 'Senior Software Engineer',
    });

    const result = await jobService.updateJob(dto, userId, companyId, jobId);

    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockCompanyDao.canManage).toHaveBeenCalledWith(companyId, userId);
    expect(mockJobDao.updateJob).toHaveBeenCalledWith(
      dto,
      mockUser.id,
      mockCompany.id,
      jobId,
    );
    expect(result.message).toBe('Job updated successfully');
    expect(result.updatedBy).toBe(mockUser.email);
  });

  it('should throw error when user does not have permission', async () => {
    const dto = { jobTitle: 'Senior Software Engineer' };
    const userId = 'user_123';
    const companyId = 'company_123';
    const jobId = 'job_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(false);

    await expect(
      jobService.updateJob(dto, userId, companyId, jobId),
    ).rejects.toThrow(
      'You do not have permission to update a job in this company',
    );
    expect(mockJobDao.updateJob).not.toHaveBeenCalled();
  });

  it('should throw error when job not found', async () => {
    const dto = { jobTitle: 'Senior Software Engineer' };
    const userId = 'user_123';
    const companyId = 'company_123';
    const jobId = 'job_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(true);
    mockJobDao.updateJob.mockResolvedValue(null);

    await expect(
      jobService.updateJob(dto, userId, companyId, jobId),
    ).rejects.toThrow('Job not found, already deleted, or closed');
  });
});

/**
 * Delete Job tests
 */
describe('deleteJob', () => {
  it('should delete job successfully', async () => {
    const userId = 'user_123';
    const companyId = 'company_123';
    const jobId = 'job_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();
    const mockJob = createMockJob({ isVisible: false, closed: true });

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(true);
    mockJobDao.deleteJob.mockResolvedValue(mockJob);

    const result = await jobService.deleteJob(userId, companyId, jobId);

    expect(mockUserDao.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockCompanyDao.isActive).toHaveBeenCalledWith(companyId);
    expect(mockCompanyDao.canManage).toHaveBeenCalledWith(companyId, userId);
    expect(mockJobDao.deleteJob).toHaveBeenCalledWith(
      mockUser.id,
      mockCompany.id,
      jobId,
    );
    expect(result.message).toBe('Job deleted successfully');
    expect(result.deletedBy).toBe(mockUser.email);
  });

  it('should throw error when user does not have permission', async () => {
    const userId = 'user_123';
    const companyId = 'company_123';
    const jobId = 'job_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(false);

    await expect(
      jobService.deleteJob(userId, companyId, jobId),
    ).rejects.toThrow(
      'You do not have permission to delete a job in this company',
    );
    expect(mockJobDao.deleteJob).not.toHaveBeenCalled();
  });

  it('should throw error when job not found', async () => {
    const userId = 'user_123';
    const companyId = 'company_123';
    const jobId = 'job_123';
    const mockUser = createMockUser();
    const mockCompany = createMockCompany();

    mockUserDao.findByIdAndActive.mockResolvedValue(mockUser);
    mockCompanyDao.isActive.mockResolvedValue(mockCompany);
    mockCompanyDao.canManage.mockResolvedValue(true);
    mockJobDao.deleteJob.mockResolvedValue(null);

    await expect(
      jobService.deleteJob(userId, companyId, jobId),
    ).rejects.toThrow('Job not found or already deleted');
  });
});

/**
 * Get Jobs tests
 */
describe('getJobs', () => {
  it('should get jobs with default pagination', async () => {
    const query = {};
    const mockJobs = [createMockJob(), createMockJob({ _id: 'job_456' })];
    mockJobDao.findAll.mockResolvedValue({ jobs: mockJobs, totalCount: 2 });
    dtoSpies.jobResponse.mockReturnValue({ id: 'job_123' });

    const result = await jobService.getJobs(query);

    expect(mockJobDao.findAll).toHaveBeenCalledWith({}, 0, 10, {
      createdAt: -1,
    });
    expect(result.jobs).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should filter by companyId', async () => {
    const query = { companyId: 'company_123' };
    const mockJobs = [createMockJob()];
    mockJobDao.findAll.mockResolvedValue({ jobs: mockJobs, totalCount: 1 });
    dtoSpies.jobResponse.mockReturnValue({ id: 'job_123' });

    const result = await jobService.getJobs(query);

    expect(mockJobDao.findAll).toHaveBeenCalledWith(
      { companyId: 'company_123' },
      0,
      10,
      { createdAt: -1 },
    );
    expect(result.jobs).toHaveLength(1);
  });

  it('should filter by companyName', async () => {
    const query = { companyName: 'Test' };
    const mockCompanies = [
      createMockCompany({ _id: 'company_1' }),
      createMockCompany({ _id: 'company_2' }),
    ];
    const mockJobs = [createMockJob()];

    mockCompanyDao.findByCompanyName.mockResolvedValue(mockCompanies);
    mockJobDao.findAll.mockResolvedValue({ jobs: mockJobs, totalCount: 1 });
    dtoSpies.jobResponse.mockReturnValue({ id: 'job_123' });

    const result = await jobService.getJobs(query);

    expect(mockCompanyDao.findByCompanyName).toHaveBeenCalledWith('Test');
    expect(mockJobDao.findAll).toHaveBeenCalledWith(
      { companyId: { $in: ['company_1', 'company_2'] } },
      0,
      10,
      { createdAt: -1 },
    );
  });

  it('should return empty array when no companies found by name', async () => {
    const query = { companyName: 'Nonexistent' };

    mockCompanyDao.findByCompanyName.mockResolvedValue([]);

    const result = await jobService.getJobs(query);

    expect(result.jobs).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(mockJobDao.findAll).not.toHaveBeenCalled();
  });

  it('should filter by multiple criteria', async () => {
    const query = {
      workingTime: 'Full-time',
      jobLocation: 'Remote',
      seniorityLevel: 'Senior',
      jobTitle: 'Engineer',
      technicalSkills: 'JavaScript,Node.js',
    };
    const mockJobs = [createMockJob()];
    mockJobDao.findAll.mockResolvedValue({ jobs: mockJobs, totalCount: 1 });
    dtoSpies.jobResponse.mockReturnValue({ id: 'job_123' });

    const result = await jobService.getJobs(query);

    expect(mockJobDao.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        workingTime: 'Full-time',
        jobLocation: 'Remote',
        seniorityLevel: 'Senior',
        jobTitle: expect.any(Object),
        technicalSkills: { $in: ['JavaScript', 'Node.js'] },
      }),
      0,
      10,
      { createdAt: -1 },
    );
  });

  it('should handle pagination correctly', async () => {
    const query = { page: 2, limit: 5 };
    const mockJobs = [createMockJob()];
    mockJobDao.findAll.mockResolvedValue({ jobs: mockJobs, totalCount: 12 });
    dtoSpies.jobResponse.mockReturnValue({ id: 'job_123' });

    const result = await jobService.getJobs(query);

    expect(mockJobDao.findAll).toHaveBeenCalledWith({}, 5, 5, {
      createdAt: -1,
    });
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('should handle custom sorting', async () => {
    const query = { sort: 'jobTitle,-createdAt' };
    const mockJobs = [createMockJob()];
    mockJobDao.findAll.mockResolvedValue({ jobs: mockJobs, totalCount: 1 });
    dtoSpies.jobResponse.mockReturnValue({ id: 'job_123' });

    const result = await jobService.getJobs(query);

    expect(mockJobDao.findAll).toHaveBeenCalledWith({}, 0, 10, {
      jobTitle: 1,
      createdAt: -1,
    });
  });
});

/**
 * Get Job tests
 */
describe('getJob', () => {
  it('should get job by id successfully', async () => {
    const jobId = 'job_123';
    const mockJob = createMockJob();

    mockJobDao.findById.mockResolvedValue(mockJob);
    dtoSpies.jobResponse.mockReturnValue({
      id: 'job_123',
      jobTitle: 'Software Engineer',
    });

    const result = await jobService.getJob(jobId);

    expect(mockJobDao.findById).toHaveBeenCalledWith(jobId);
    expect(dtoSpies.jobResponse).toHaveBeenCalledWith(mockJob);
    expect(result).toBeDefined();
  });

  it('should throw error when job not found', async () => {
    const jobId = 'job_123';

    mockJobDao.findById.mockResolvedValue(null);

    await expect(jobService.getJob(jobId)).rejects.toThrow('Job not found');
  });
});

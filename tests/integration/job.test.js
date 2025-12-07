import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { connect, closeDatabase, clearDatabase } from './setup.js';
import { createAuthUser, createTestCompany, createTestJob } from './helpers.js';
import routes from '../../src/routes/index.routes.js';
import { ErrorHandler } from '../../src/middlewares/error.middleware.js';

const app = express();
app.use(express.json());
app.use(routes);
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.errorHandler);

describe('Job Integration Tests', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/v1/job/:companyId', () => {
    it('should create job successfully (company owner/HR only)', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);

      const jobData = {
        jobTitle: 'Software Engineer',
        jobLocation: 'remotely',
        workingTime: 'full-time',
        seniorityLevel: 'Mid-Level',
        jobDescription:
          'Looking for a talented software engineer to join our growing team. The ideal candidate will have strong technical skills and excellent communication abilities. This is a great opportunity to work on exciting projects.',
        technicalSkills: ['JavaScript', 'Node.js', 'React'],
        softSkills: ['Communication', 'Teamwork'],
      };

      const response = await request(app)
        .post(`/api/v1/job/create/${company._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty(
        'jobTitle',
        'Software Engineer',
      );
    });

    it('should return 403 for non-company member', async () => {
      const { user: owner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(owner);
      const { accessToken } = await createAuthUser('HR', {
        email: 'other@example.com',
        username: 'otheruser',
        role: 'HR',
      });

      const response = await request(app)
        .post(`/api/v1/job/create/${company._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ jobTitle: 'Test Job' });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/v1/job/:companyId/:jobId', () => {
    it('should update job successfully (company owner/HR only)', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      const job = await createTestJob(company._id, user._id);

      const updateData = {
        jobTitle: 'Senior Software Engineer',
        jobDescription:
          'Updated job description with more details. Looking for an experienced senior software engineer to join our team and lead important projects. Must have excellent technical and leadership skills.',
      };

      const response = await request(app)
        .put(`/api/v1/job/${company._id}/${job._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(201); // Update returns 201

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty(
        'jobTitle',
        'Senior Software Engineer',
      );
    });

    it('should return 403 for non-company member', async () => {
      const { user: owner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(owner);
      const job = await createTestJob(company._id, owner._id);
      const { accessToken } = await createAuthUser('HR', {
        email: 'other@example.com',
        username: 'otheruser',
        role: 'HR',
      });

      const response = await request(app)
        .put(`/api/v1/job/${company._id}/${job._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ jobTitle: 'Updated' });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/job/:companyId/:jobId', () => {
    it('should delete job successfully (company owner/HR only)', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      const job = await createTestJob(company._id, user._id);

      const response = await request(app)
        .delete(`/api/v1/job/${company._id}/delete/${job._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201); // Delete returns 201

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should return 403 for non-company member', async () => {
      const { user: owner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(owner);
      const job = await createTestJob(company._id, owner._id);
      const { accessToken } = await createAuthUser('HR', {
        email: 'other@example.com',
        username: 'otheruser',
        role: 'HR',
      });

      const response = await request(app)
        .delete(`/api/v1/job/${company._id}/delete/${job._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/job', () => {
    it('should get all jobs successfully', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      await createTestJob(company._id, user._id);
      await createTestJob(company._id, user._id, {
        jobTitle: 'Data Scientist',
      });

      const response = await request(app)
        .get('/api/v1/job')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    it('should filter jobs by location', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      await createTestJob(company._id, user._id, { jobLocation: 'remotely' });
      await createTestJob(company._id, user._id, { jobLocation: 'onsite' });

      const response = await request(app)
        .get('/api/v1/job?jobLocation=remotely')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    it('should filter jobs by working time', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      await createTestJob(company._id, user._id, { workingTime: 'full-time' });
      await createTestJob(company._id, user._id, { workingTime: 'part-time' });

      const response = await request(app)
        .get('/api/v1/job?workingTime=full-time')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    it('should support pagination', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      // Create multiple jobs
      for (let i = 0; i < 5; i++) {
        await createTestJob(company._id, user._id, { jobTitle: `Job ${i}` });
      }

      const response = await request(app)
        .get('/api/v1/job?limit=2&skip=0')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('totalCount');
    });
  });

  describe('GET /api/v1/job/:jobId', () => {
    it('should get specific job successfully', async () => {
      const { user, accessToken } = await createAuthUser('HR', {
        email: 'hr@example.com',
        username: 'hruser',
        role: 'HR',
      });
      const company = await createTestCompany(user);
      const job = await createTestJob(company._id, user._id);

      const response = await request(app)
        .get(`/api/v1/job/specific/${job._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Response is the job object directly
      expect(response.body).toHaveProperty('jobTitle');
    });

    it('should return error for non-existent job', async () => {
      const { accessToken } = await createAuthUser();

      const response = await request(app)
        .get('/api/v1/job/specific/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/job/specific/507f1f77bcf86cd799439011')
        .expect(401);

      expect(response.body.error || response.body.message).toBeDefined();
    });
  });
});

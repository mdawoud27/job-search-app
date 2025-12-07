// import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { connect, closeDatabase, clearDatabase } from './setup.js';
import { createAuthUser, createTestCompany } from './helpers.js';
import routes from '../../src/routes/index.routes.js';
import { ErrorHandler } from '../../src/middlewares/error.middleware.js';

const app = express();
app.use(express.json());
app.use(routes);
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.errorHandler);

describe('Admin Integration Tests', () => {
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

  describe('PATCH /api/v1/admin/ban-user', () => {
    it('should ban user successfully (admin only)', async () => {
      const { user: targetUser } = await createAuthUser('User', {
        email: 'target@example.com',
        username: 'targetuser',
      });
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/ban-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('banned');
    });

    it('should return 403 for non-admin user', async () => {
      const { user: targetUser } = await createAuthUser('User', {
        email: 'target@example.com',
        username: 'targetuser',
      });
      const { accessToken } = await createAuthUser();

      const response = await request(app)
        .patch('/api/v1/admin/ban-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: targetUser._id.toString() })
        .expect(403);

      expect(response.body.error || response.body.message).toBeDefined();
    });

    it('should return error when user not found', async () => {
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/ban-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: '507f1f77bcf86cd799439011' });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error || response.body.message).toBeDefined();
    });

    it('should return error when user already banned', async () => {
      const { user: targetUser } = await createAuthUser('User', {
        email: 'target@example.com',
        username: 'targetuser',
        bannedAt: new Date(),
      });
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/ban-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser._id.toString() });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error || response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/unban-user', () => {
    it('should unban user successfully (admin only)', async () => {
      const { user: targetUser } = await createAuthUser('User', {
        email: 'target@example.com',
        username: 'targetuser',
        bannedAt: new Date(),
      });
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/unban-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('unbanned');
    });

    it('should return 403 for non-admin user', async () => {
      const { user: targetUser } = await createAuthUser('User', {
        email: 'target@example.com',
        username: 'targetuser',
        bannedAt: new Date(),
      });
      const { accessToken } = await createAuthUser();

      const response = await request(app)
        .patch('/api/v1/admin/unban-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: targetUser._id.toString() })
        .expect(403);

      expect(response.body.error || response.body.message).toBeDefined();
    });

    it('should return error when user not banned', async () => {
      const { user: targetUser } = await createAuthUser('User', {
        email: 'target@example.com',
        username: 'targetuser',
      });
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/unban-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser._id.toString() });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error || response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/ban-company', () => {
    it('should ban company successfully (admin only)', async () => {
      const { user: companyOwner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(companyOwner);
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/ban-company')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ companyId: company._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('banned');
    });

    it('should return 403 for non-admin user', async () => {
      const { user: companyOwner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(companyOwner);
      const { accessToken } = await createAuthUser();

      const response = await request(app)
        .patch('/api/v1/admin/ban-company')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyId: company._id.toString() })
        .expect(403);

      expect(response.body.error || response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/unban-company', () => {
    it('should unban company successfully (admin only)', async () => {
      const { user: companyOwner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(companyOwner, {
        bannedAt: new Date(),
      });
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/unban-company')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ companyId: company._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('unbanned');
    });

    it('should return 403 for non-admin user', async () => {
      const { user: companyOwner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(companyOwner, {
        bannedAt: new Date(),
      });
      const { accessToken } = await createAuthUser();

      const response = await request(app)
        .patch('/api/v1/admin/unban-company')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyId: company._id.toString() })
        .expect(403);

      expect(response.body.error || response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/approve-company', () => {
    it('should approve company successfully (admin only)', async () => {
      const { user: companyOwner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(companyOwner, {
        approvedByAdmin: false,
      });
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/approve-company')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ companyId: company._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('approved');
    });

    it('should return 403 for non-admin user', async () => {
      const { user: companyOwner } = await createAuthUser('HR', {
        email: 'owner@example.com',
        username: 'owneruser',
        role: 'HR',
      });
      const company = await createTestCompany(companyOwner, {
        approvedByAdmin: false,
      });
      const { accessToken } = await createAuthUser();

      const response = await request(app)
        .patch('/api/v1/admin/approve-company')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyId: company._id.toString() })
        .expect(403);

      expect(response.body.error || response.body.message).toBeDefined();
    });

    it('should return error when company not found', async () => {
      const { accessToken: adminToken } = await createAuthUser('Admin', {
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'Admin',
      });

      const response = await request(app)
        .patch('/api/v1/admin/approve-company')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ companyId: '507f1f77bcf86cd799439011' });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error || response.body.message).toBeDefined();
    });
  });
});

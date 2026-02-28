const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../config/db');
const { Tenant, User } = require('../../models');
const bcrypt = require('bcryptjs');

let testTenant;
let testAdmin;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  testTenant = await Tenant.create({
    name: 'Test Flight School',
    slug: 'test-school',
    isActive: true,
  });

  const passwordHash = await bcrypt.hash('AdminPass123!', 12);
  testAdmin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    passwordHash,
    tenantId: testTenant.id,
    role: 'ADMIN',
    isApproved: true,
    isActive: true,
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    test('should register a new student', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          password: 'Password123!',
          tenantSlug: 'test-school',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('john@test.com');
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.user.isApproved).toBe(false);
    });

    test('should reject duplicate email in same tenant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          password: 'Password123!',
          tenantSlug: 'test-school',
        });

      expect(res.status).toBe(409);
    });

    test('should reject registration with invalid tenant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          tenantSlug: 'nonexistent-school',
        });

      expect(res.status).toBe(404);
    });

    test('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane2@test.com',
          password: '123',
          tenantSlug: 'test-school',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPass123!',
          tenantSlug: 'test-school',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    test('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
          tenantSlug: 'test-school',
        });

      expect(res.status).toBe(401);
    });

    test('should reject cross-tenant login', async () => {
      // User exists in test-school but tries to login with another tenant
      await Tenant.create({ name: 'Other School', slug: 'other-school', isActive: true });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPass123!',
          tenantSlug: 'other-school',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Cross-tenant isolation', () => {
    test('should not expose users from other tenants', async () => {
      // Login as admin
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminPass123!', tenantSlug: 'test-school' });

      const token = loginRes.body.data.accessToken;

      // Create user in other tenant
      const otherTenant = await Tenant.findOne({ where: { slug: 'other-school' } });
      if (otherTenant) {
        await User.create({
          firstName: 'Other',
          lastName: 'User',
          email: 'other@other.com',
          passwordHash: await bcrypt.hash('pass', 10),
          tenantId: otherTenant.id,
          role: 'STUDENT',
          isApproved: true,
        });
      }

      // Admin from test-school cannot see other-school users
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const emails = res.body.data.map((u) => u.email);
      expect(emails).not.toContain('other@other.com');
    });
  });
});

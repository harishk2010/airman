// Integration test setup
// Uses real DB (test database)
// Run with: npm run test:integration

const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../config/db');
const { Tenant, User } = require('../../models');
const bcrypt = require('bcryptjs');

let testTenant;
let adminUser;
let adminToken;
let studentUser;
let studentToken;
let instructorUser;
let instructorToken;

const setupTestDB = async () => {
  await sequelize.sync({ force: true });

  // Create test tenant
  testTenant = await Tenant.create({ name: 'Test School', slug: 'test-school' });

  // Create admin
  adminUser = await User.create({
    tenant_id: testTenant.id, email: 'admin@test.com',
    password_hash: await bcrypt.hash('Admin@123', 10),
    first_name: 'Admin', last_name: 'User',
    role: 'ADMIN', is_approved: true,
  });

  // Create student
  studentUser = await User.create({
    tenant_id: testTenant.id, email: 'student@test.com',
    password_hash: await bcrypt.hash('Student@123', 10),
    first_name: 'Student', last_name: 'User',
    role: 'STUDENT', is_approved: true,
  });

  // Create instructor
  instructorUser = await User.create({
    tenant_id: testTenant.id, email: 'instructor@test.com',
    password_hash: await bcrypt.hash('Instructor@123', 10),
    first_name: 'Instructor', last_name: 'User',
    role: 'INSTRUCTOR', is_approved: true,
  });
};

const getToken = async (email, password) => {
  const res = await request(app).post('/api/v1/auth/login').send({
    email, password, tenant_id: testTenant.id,
  });
  return res.body.accessToken;
};

module.exports = {
  app, sequelize,
  getTestTenant: () => testTenant,
  getAdminUser: () => adminUser,
  getStudentUser: () => studentUser,
  getInstructorUser: () => instructorUser,
  setupTestDB,
  getToken,
};

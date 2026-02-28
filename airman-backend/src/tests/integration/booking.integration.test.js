const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../config/db');
const { Tenant, User } = require('../../models');
const bcrypt = require('bcryptjs');

let tenant, admin, instructor, student;
let adminToken, instructorToken, studentToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  tenant = await Tenant.create({ name: 'Booking Test School', slug: 'booking-school', isActive: true });

  const hash = async (p) => bcrypt.hash(p, 10);

  admin = await User.create({ firstName: 'Admin', lastName: 'B', email: 'admin@b.com', passwordHash: await hash('pass123456'), tenantId: tenant.id, role: 'ADMIN', isApproved: true, isActive: true });
  instructor = await User.create({ firstName: 'Inst', lastName: 'B', email: 'inst@b.com', passwordHash: await hash('pass123456'), tenantId: tenant.id, role: 'INSTRUCTOR', isApproved: true, isActive: true });
  student = await User.create({ firstName: 'Stud', lastName: 'B', email: 'stud@b.com', passwordHash: await hash('pass123456'), tenantId: tenant.id, role: 'STUDENT', isApproved: true, isActive: true });

  const login = async (email) => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'pass123456', tenantSlug: 'booking-school' });
    return res.body.data.accessToken;
  };

  adminToken = await login('admin@b.com');
  instructorToken = await login('inst@b.com');
  studentToken = await login('stud@b.com');
});

afterAll(async () => {
  await sequelize.close();
});

describe('Booking Integration Tests', () => {
  let booking1Id;

  test('student can create booking request', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Flight Lesson 1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('requested');
    booking1Id = res.body.data.id;
  });

  test('admin can approve booking', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${booking1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  test('admin can assign instructor to booking', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${booking1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ instructorId: instructor.id });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('assigned');
    expect(res.body.data.instructorId).toBe(instructor.id);
  });

  test('should reject conflicting booking for same instructor', async () => {
    // Create another student booking with same time
    const firstBooking = await request(app).get(`/api/v1/bookings/${booking1Id}`).set('Authorization', `Bearer ${adminToken}`);
    const { startTime, endTime } = firstBooking.body.data;

    // Create new booking in same slot
    const newBooking = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Conflicting Lesson', startTime, endTime });

    await request(app)
      .patch(`/api/v1/bookings/${newBooking.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    // Try to assign same instructor (should conflict)
    const conflictRes = await request(app)
      .patch(`/api/v1/bookings/${newBooking.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ instructorId: instructor.id });

    expect(conflictRes.status).toBe(409);
  });

  test('student cannot access another student bookings', async () => {
    // Create another student
    const hash = await bcrypt.hash('pass123456', 10);
    await User.create({ firstName: 'Stud2', lastName: 'B', email: 'stud2@b.com', passwordHash: hash, tenantId: tenant.id, role: 'STUDENT', isApproved: true, isActive: true });

    const login2 = await request(app).post('/api/v1/auth/login').send({ email: 'stud2@b.com', password: 'pass123456', tenantSlug: 'booking-school' });
    const token2 = login2.body.data.accessToken;

    // Student 2 should not see student 1's bookings
    const res = await request(app).get('/api/v1/bookings').set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((b) => b.studentId !== student.id)).toBe(true);
  });
});

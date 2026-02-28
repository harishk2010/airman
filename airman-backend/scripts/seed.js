#!/usr/bin/env node
/**
 * Seed script - creates tenants + admin accounts only.
 * Instructors are created by admins via the UI.
 * Students self-register and must be approved by admin.
 * 
 * Run: node scripts/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, sequelize } = require('../src/config/db');
const { Tenant, User } = require('../src/models');

async function seed() {
  await connectDB();
  await sequelize.sync({ force: false });

  console.log('🌱 Seeding database...');

  // ─── TENANTS ────────────────────────────────────────────────────────────
  const [tenantA] = await Tenant.findOrCreate({
    where: { slug: 'alpha-flight-school' },
    defaults: { name: 'Alpha Flight School', slug: 'alpha-flight-school' },
  });

  const [tenantB] = await Tenant.findOrCreate({
    where: { slug: 'bravo-aviation' },
    defaults: { name: 'Bravo Aviation Academy', slug: 'bravo-aviation' },
  });

  console.log(`✅ Tenants: ${tenantA.name}, ${tenantB.name}`);

  // ─── ADMIN FOR TENANT A ─────────────────────────────────────────────────
  const hash = async (p) => bcrypt.hash(p, 12);

  const [adminA] = await User.findOrCreate({
    where: { email: 'admin@alpha.com', tenantId: tenantA.id },
    defaults: {
      email: 'admin@alpha.com',
      passwordHash: await hash('Admin@Alpha123'),
      firstName: 'Alice',
      lastName: 'Admin',
      tenantId: tenantA.id,
      role: 'ADMIN',
      isApproved: true,
    },
  });

  // ─── ADMIN FOR TENANT B ─────────────────────────────────────────────────
  const [adminB] = await User.findOrCreate({
    where: { email: 'admin@bravo.com', tenantId: tenantB.id },
    defaults: {
      email: 'admin@bravo.com',
      passwordHash: await hash('Admin@Bravo123'),
      firstName: 'Bob',
      lastName: 'AdminB',
      tenantId: tenantB.id,
      role: 'ADMIN',
      isApproved: true,
    },
  });

  console.log('✅ Admin accounts created');
  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TENANT A - Alpha Flight School');
  console.log(`  Slug:    alpha-flight-school`);
  console.log(`  Admin:   admin@alpha.com  /  Admin@Alpha123`);
  console.log('');
  console.log('TENANT B - Bravo Aviation Academy');
  console.log(`  Slug:    bravo-aviation`);
  console.log(`  Admin:   admin@bravo.com  /  Admin@Bravo123`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Log in as admin');
  console.log('  2. Create instructors via Admin → User Management → Add Instructor');
  console.log('  3. Students self-register → admin approves them via User Management');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

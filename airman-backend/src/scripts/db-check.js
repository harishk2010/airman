// src/scripts/db-check.js
// Used by CI to verify the schema syncs cleanly without force-dropping tables
const { sequelize } = require('../config/db');

sequelize
  .sync({ force: false, alter: false })
  .then(() => {
    console.log('Migration check passed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration check FAILED:', err.message);
    process.exit(1);
  });
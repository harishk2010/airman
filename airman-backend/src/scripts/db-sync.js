// src/scripts/db-sync.js
// Used by CI to sync the database schema before integration tests
const { sequelize } = require('../config/db');

sequelize
  .sync({ force: true })
  .then(() => {
    console.log('DB synced successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('DB sync failed:', err.message);
    process.exit(1);
  });
// One-time script to create the first admin account.
// Admin is never created via public signup, so this is the way in.
//
// Usage:
//   1. Add ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD (and optionally ADMIN_PHONE)
//      to the root .env file.
//   2. From /server, run: node seedAdmin.js  (or: npm run seed:admin)
//
// Safe to re-run — it refuses to overwrite an existing account with the
// same email instead of silently promoting/resetting it.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const mongoose = require('mongoose');

const run = async () => {
  const { ADMIN_NAME: name, ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_PHONE: phone } = process.env;

  if (!name || !email || !password) {
    console.error(
      'Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD.\n' +
      'Add them to the root .env file, then re-run: node seedAdmin.js'
    );
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(
      `A user with email "${email}" already exists (role: ${existing.role}). ` +
      'Use a different ADMIN_EMAIL, or update that account\'s role directly in the database.'
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = new User({ name, email, phone, role: 'admin' });
  admin.password = password;
  await admin.save();

  console.log(`Admin account created: ${admin.email}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('Failed to seed admin:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});

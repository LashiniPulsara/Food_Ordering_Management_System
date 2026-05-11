const User = require('../models/User');

const seedAdmin = async () => {
  try {
    if (process.env.SEED_ADMIN_ON_STARTUP !== 'true') {
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('Skipping admin seed: ADMIN_EMAIL and ADMIN_PASSWORD are required.');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account already exists (${adminEmail})`);
      return;
    }

    // Create admin user
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      phone: '0000000000',
      role: 'admin',
      profileImage: 'default.jpg',
    });

    console.log(`Admin account created successfully (${adminEmail})`);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;

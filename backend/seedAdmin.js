const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@uae.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit();
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@uae.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: admin123`);
    console.log(`Role: ${admin.role}`);

    // Create a test worker
    const workerPassword = await bcrypt.hash('worker123', 10);
    const worker = await User.create({
      name: 'Test Worker',
      email: 'worker@uae.com',
      password: workerPassword,
      role: 'worker'
    });

    console.log('\nTest worker created:');
    console.log(`Email: ${worker.email}`);
    console.log(`Password: worker123`);
    console.log(`Role: ${worker.role}`);

    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();

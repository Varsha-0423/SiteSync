const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Correct User model path
const User = require('./models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

const createSupervisor = async () => {
  try {
    // Check if supervisor already exists
    const existingSupervisor = await User.findOne({ email: 'supervisor@test.com' });
    
    if (existingSupervisor) {
      console.log('Supervisor already exists:', {
        email: existingSupervisor.email,
        role: existingSupervisor.role,
        _id: existingSupervisor._id
      });
      process.exit(0);
    }

    // Create new supervisor
    const password = 'password123'; // change if needed
    const hashed = await bcrypt.hash(password, 10);

    const supervisor = await User.create({
      name: 'Supervisor',
      email: 'supervisor@test.com',
      password: hashed,
      role: 'supervisor'
    });

    console.log('\nSupervisor created successfully:');
    console.log({
      email: supervisor.email,
      password, // show plain password only now
      role: supervisor.role,
      _id: supervisor._id
    });
    
  } catch (error) {
    console.error('Error creating supervisor:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Run
connectDB().then(createSupervisor);

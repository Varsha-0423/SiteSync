const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

// Load environment variables
dotenv.config();

async function resetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Find the supervisor user
    const email = 'supervisor@test.com';
    const newPassword = '123456';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('🔍 Found user:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully!');
    console.log('New hashed password:', hashedPassword);
    
    // Verify the new password
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log('🔑 Password verification:', isMatch ? '✅ Match' : '❌ No match');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();

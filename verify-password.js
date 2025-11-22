const bcrypt = require('bcryptjs');

const hashedPassword = "$2b$10$/c7NPqZ7.QoGigQiAolre.2XQNZXipHI1nOUsNSGD9.Akqfh5aQhS";
const testPassword = "123456";

async function verifyPassword() {
  try {
    console.log('Verifying password...');
    console.log('Hashed password from DB:', hashedPassword);
    
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    
    if (isMatch) {
      console.log('✅ Password matches!');
    } else {
      console.log('❌ Password does not match!');
    }
    
    // Check if password needs rehashing (if the cost factor changes in the future)
    const needsRehash = await bcrypt.getRounds(hashedPassword) < 10;
    if (needsRehash) {
      console.log('ℹ️  Password should be rehashed with a higher cost factor');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyPassword();

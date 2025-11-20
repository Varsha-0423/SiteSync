const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.json({ success: true, user });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  console.log('Login request received:', { 
    body: req.body,
    headers: req.headers,
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? '***' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
        error: 'Missing credentials'
      });
    }

    console.log('Login attempt for email:', email);
    
    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      const error = new Error('JWT_SECRET is not set in environment variables');
      console.error('JWT_SECRET missing:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error',
        error: 'Server configuration error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    let user;
    try {
      console.log('Attempting to find user with email:', email);
      user = await User.findOne({ email }).select('+password').lean().exec();
      
      if (!user) {
        console.log('Login failed: User not found for email:', email);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid email or password',
          error: 'Invalid credentials'
        });
      }
      
      console.log('User found:', { 
        userId: user._id, 
        role: user.role,
        hasPassword: !!user.password 
      });
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error during authentication',
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    console.log('User found, comparing passwords...');
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Login failed: Invalid password for email:', email);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid email or password',
          error: 'Invalid password'
        });
      }
    } catch (compareError) {
      console.error('Error comparing passwords:', compareError);
      return res.status(500).json({
        success: false,
        message: 'Error during authentication',
        error: 'Password comparison failed',
        details: process.env.NODE_ENV === 'development' ? compareError.message : undefined
      });
    }

    console.log('Password match, generating token...');
    try {
      const payload = { 
        id: user._id.toString(), 
        role: user.role,
        email: user.email
      };
      
      console.log('Creating JWT with payload:', payload);
      
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET, 
        { 
          expiresIn: process.env.JWT_EXPIRE || '7d',
          algorithm: 'HS256'
        }
      );

      console.log('Token generated successfully');
      
      // Remove password from user object before sending response
      const userResponse = { ...user };
      delete userResponse.password;

      res.json({ 
        success: true, 
        token, 
        user: userResponse 
      });
      
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error generating authentication token',
        error: tokenError.message 
      });
    }

  } catch (error) {
    console.error('Login error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('MongoDB error during login:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error during login',
        error: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  try {
    // The user ID is attached to the request by the auth middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

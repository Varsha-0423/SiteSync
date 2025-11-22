const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields (name, email, password)' 
      });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create user with hashed password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: (role && ['admin', 'supervisor', 'worker'].includes(role.toLowerCase())) 
        ? role.toLowerCase() 
        : 'worker'
    });

    // Save the user
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Create response without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    // Send response with token and user data
    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error (unique email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to normalize email
const normalizeEmail = (email) => email ? email.toLowerCase().trim() : '';

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    let { email, password, role } = req.body;
    
    // Normalize email
    email = normalizeEmail(email);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
        error: 'missing_credentials'
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'invalid_credentials'
      });
    }

    // Check if user has a password (in case of OAuth users)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Please use the correct login method for this account',
        error: 'invalid_auth_method'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'invalid_credentials'
      });
    }

    // Check role if specified
    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this role',
        error: 'unauthorized_role'
      });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();
    
    // Create response without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    // Send token and user data
    res.json({
      success: true,
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'validation_error',
        details: process.env.NODE_ENV === 'development' 
          ? Object.values(error.errors).map(e => e.message) 
          : undefined
      });
    }
    
    // Handle MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: 'database_error',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: error.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token'
      });
    }
    
    // Generic error handler
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: 'server_error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// VERIFY TOKEN
exports.verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (thanks to protect middleware)
    // and req.user is populated by the protect middleware
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message
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

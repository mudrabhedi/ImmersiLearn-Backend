const User = require('../models/User');
const Professor = require('../models/Professor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Common functions
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const sanitizeInput = (input) => {
  return input.toString().trim();
};

// User Authentication
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const existingUser = await User.findOne({ email: sanitizedEmail });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({
      name: sanitizeInput(name),
      email: sanitizedEmail,
      password: await bcrypt.hash(password, 12),
      role: 'user'
    });

    await user.save();
    
    res.status(201).json({
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Professor Authentication
exports.registerProfessor = async (req, res, next) => {
  try {
    const { name, email, password, institution } = req.body;
    
    // Input validation
    if (!name || !email || !password || !institution) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (institution.length < 2) {
      return res.status(400).json({ error: 'Institution name is too short' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const [existingProfessor, existingUser] = await Promise.all([
      Professor.findOne({ email: sanitizedEmail }),
      User.findOne({ email: sanitizedEmail })
    ]);

    if (existingProfessor || existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const professor = new Professor({
      name: sanitizeInput(name),
      email: sanitizedEmail,
      password: await bcrypt.hash(password, 12),
      institution: sanitizeInput(institution),
      role: 'professor'
    });

    await professor.save();
    
    res.status(201).json({
      success: true,
      token: generateToken(professor),
      professor: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        institution: professor.institution,
        role: professor.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login functions
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.loginProfessor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.warn('Login attempt with missing fields');
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required',
        field: !email ? 'email' : 'password'
      });
    }

    // Sanitize and normalize email
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      console.warn(`Invalid email format: ${sanitizedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Find professor with case-insensitive search
    const professor = await Professor.findOne({ 
      email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') }
    }).select('+password'); // Ensure password field is returned

    if (!professor) {
      console.warn(`No professor found for email: ${sanitizedEmail}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        suggestion: 'Please check your email or register first'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, professor.password);
    if (!isMatch) {
      console.warn(`Password mismatch for professor: ${professor._id}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        suggestion: 'Please check your password'
      });
    }

    // Generate token with additional security claims
    const token = generateToken(professor);
    
    // Set secure httpOnly cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Successful login response
    console.log(`Successful login for professor: ${professor._id}`);
    res.status(200).json({
      success: true,
      token,
      professor: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        institution: professor.institution,
        role: professor.role
      },
      message: 'Login successful'
    });

  } catch (err) {
    console.error('Professor login error:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    next(err);
  }
};
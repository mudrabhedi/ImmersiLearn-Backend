const User = require('../models/User');
const Professor = require('../models/Professor'); // Assuming you have a separate Professor model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Common function to generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1d' }
  );
};

// ======================
// USER AUTHENTICATION
// ======================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      role: 'user' 
    });
    
    await user.save();

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// ======================
// PROFESSOR AUTHENTICATION
// ======================
exports.registerProfessor = async (req, res) => {
  const { name, email, password, institution } = req.body;
  
  try {
    // Check if professor exists
    let professor = await Professor.findOne({ email });
    if (professor) {
      return res.status(400).json({ msg: 'Professor already exists' });
    }

    // Check if email is already registered as user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        msg: 'Email already registered as a user' 
      });
    }

    // Create new professor
    const hashedPassword = await bcrypt.hash(password, 10);
    professor = new Professor({
      name,
      email,
      password: hashedPassword,
      institution,
      role: 'professor'
    });

    await professor.save();

    const token = generateToken(professor);
    res.status(201).json({
      token,
      professor: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        institution: professor.institution,
        role: professor.role
      }
    });

  } catch (err) {
    console.error('Professor registration error:', err);
    res.status(500).json({ 
      msg: 'Server error during professor registration',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.loginProfessor = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const professor = await Professor.findOne({ email });
    if (!professor) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, professor.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const token = generateToken(professor);
    res.json({
      token,
      professor: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        institution: professor.institution,
        role: professor.role
      }
    });

  } catch (err) {
    console.error('Professor login error:', err);
    res.status(500).json({ 
      msg: 'Server error during professor login',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};
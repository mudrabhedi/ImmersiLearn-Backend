const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Professor = require('../models/Professor'); // Add Professor model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================
// COMMON AUTH FUNCTIONS
// ======================

const generateToken = (user, role) => {
  return jwt.sign(
    { id: user._id, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1d' }
  );
};

// ======================
// USER AUTHENTICATION
// ======================

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      role: 'user'
    });

    await user.save();

    const token = generateToken(user, 'user');
    res.status(201).json({ 
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user, 'user');
    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// ======================
// PROFESSOR AUTHENTICATION
// ======================

router.post('/signup-professor', async (req, res) => {
  const { name, email, password, institution } = req.body;

  try {
    // Validate input
    if (!name || !email || !password || !institution) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email exists in either collection
    const existingProfessor = await Professor.findOne({ email });
    const existingUser = await User.findOne({ email });
    
    if (existingProfessor || existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const professor = new Professor({
      name,
      email,
      password: hashedPassword,
      institution,
      role: 'professor'
    });

    await professor.save();

    const token = generateToken(professor, 'professor');
    res.status(201).json({
      message: 'Professor registration successful',
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
    console.error('Professor signup error:', err);
    res.status(500).json({
      message: 'Server error during professor registration',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

router.post('/login-professor', async (req, res) => {
  const { email, password } = req.body;

  try {
    const professor = await Professor.findOne({ email });
    if (!professor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, professor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(professor, 'professor');
    res.status(200).json({
      message: 'Professor login successful',
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
      message: 'Server error during professor login',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// ======================
// OPENAI STORY ROUTE
// ======================

router.get('/story', async (req, res) => {
  try {
    const response = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: "Write a one-sentence bedtime story about a unicorn.",
      max_tokens: 100
    });
    
    res.status(200).json({ 
      story: response.choices[0].text.trim() 
    });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ 
      error: "Failed to generate story",
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// =====================
// Database Connection
// =====================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// =====================
// User Model
// =====================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor'], default: 'student' },
  institution: { type: String }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', UserSchema);

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://immersi-learn.vercel.app'],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// =====================
// JWT Token Generator
// =====================
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// =====================
// Auth Routes
// =====================
// Standard signup (for both students/professors)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, institution } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'student',
      institution
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({ 
      success: true,
      token,
      role: newUser.role,
      user: {
        name: newUser.name,
        email: newUser.email,
        institution: newUser.institution
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed. Try again.' });
  }
});

// Professor-specific registration
app.post('/api/professors/register', async (req, res) => {
  try {
    const { name, email, password, institution } = req.body;

    // Validate input
    if (!name || !email || !password || !institution) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if professor exists
    const existingProfessor = await User.findOne({ email });
    if (existingProfessor) {
      return res.status(400).json({ error: 'Professor already registered' });
    }

    // Create professor
    const newProfessor = new User({
      name,
      email,
      password,
      role: 'professor',
      institution
    });

    await newProfessor.save();

    // Generate token
    const token = generateToken(newProfessor);

    res.status(201).json({ 
      success: true,
      token,
      role: 'professor',
      user: {
        name: newProfessor.name,
        email: newProfessor.email,
        institution: newProfessor.institution
      }
    });
  } catch (err) {
    console.error('Professor registration error:', err);
    res.status(500).json({ error: 'Professor registration failed.' });
  }
});

// =====================
// Health Check
// =====================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// =====================
// Server Start
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

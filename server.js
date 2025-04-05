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
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// =====================
// Models
// =====================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor'], default: 'student' },
  institution: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const LeaderboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', UserSchema);
const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://immersi-learn.vercel.app'],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// JWT Verification Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

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
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, institution } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = new User({
      name,
      email,
      password,
      role: role || 'student',
      institution
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({ 
      success: true,
      token,
      role: newUser.role,
      user: {
        id: newUser._id,
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

app.post('/api/professors/register', async (req, res) => {
  try {
    const { name, email, password, institution } = req.body;

    if (!name || !email || !password || !institution) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingProfessor = await User.findOne({ email });
    if (existingProfessor) {
      return res.status(400).json({ error: 'Professor already registered' });
    }

    const newProfessor = new User({
      name,
      email,
      password,
      role: 'professor',
      institution
    });

    await newProfessor.save();
    const token = generateToken(newProfessor);

    res.status(201).json({ 
      success: true,
      token,
      role: 'professor',
      user: {
        id: newProfessor._id,
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
// Leaderboard Routes
// =====================
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find()
      .sort({ score: -1 })
      .limit(100)
      .populate('user', 'name email');

    res.json(leaderboard.map(entry => ({
      _id: entry._id,
      username: entry.user.name,
      email: entry.user.email,
      score: entry.score,
      date: entry.date
    })));
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/api/leaderboard', authenticate, async (req, res) => {
  try {
    const { score } = req.body;
    if (!score) return res.status(400).json({ error: 'Score is required' });

    const newEntry = new Leaderboard({
      user: req.user.id,
      score
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Leaderboard submission error:', err);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// =====================
// Health Check
// =====================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptime: process.uptime()
    }
  });
});

// =====================
// Error Handling
// =====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// =====================
// Server Start
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${process.env.NODE_ENV === 'production' ? 'https://immersi-learn.vercel.app' : 'http://localhost:3000'}`);
});

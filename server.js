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

// Database Connection
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

// Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor'], default: 'student' },
  institution: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  duration: { type: Number, default: 30 },
  totalQuestions: { type: Number, default: 10 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['book', 'material'], required: true },
  author: String,
  isbn: String,
  fileUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', UserSchema);
const Quiz = mongoose.model('Quiz', QuizSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Announcement = mongoose.model('Announcement', AnnouncementSchema);

// Middleware
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

// JWT Token Generator
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Auth Routes
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

    const newUser = new User({ name, email, password, role: role || 'student', institution });
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

// Professor Routes
app.get('/api/professor/profile', authenticate, async (req, res) => {
  try {
    const professor = await User.findById(req.user.id);
    if (!professor) return res.status(404).json({ error: 'Professor not found' });
    res.json(professor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/professor/profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const professor = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(professor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Quiz Routes
app.get('/api/professor/quizzes', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

app.post('/api/professor/quizzes', authenticate, async (req, res) => {
  try {
    const { title, description, duration, totalQuestions } = req.body;
    const newQuiz = new Quiz({
      title,
      description,
      duration,
      totalQuestions,
      createdBy: req.user.id
    });
    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Resource Routes
app.get('/api/professor/resources', authenticate, async (req, res) => {
  try {
    const resources = await Resource.find({ createdBy: req.user.id });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.post('/api/professor/resources', authenticate, async (req, res) => {
  try {
    const { title, type, author, isbn, fileUrl } = req.body;
    const newResource = new Resource({
      title,
      type,
      author,
      isbn,
      fileUrl,
      createdBy: req.user.id
    });
    await newResource.save();
    res.status(201).json(newResource);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// Announcement Routes
app.get('/api/professor/announcements', authenticate, async (req, res) => {
  try {
    const announcements = await Announcement.find({ createdBy: req.user.id });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/professor/announcements', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newAnnouncement = new Announcement({
      title,
      content,
      createdBy: req.user.id
    });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptime: process.uptime()
    }
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

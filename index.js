const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('./passport'); // Import your Google strategy

const app = express();

// Configure CORS
app.use(cors({
  origin: "https://immersi-learn-q58d.vercel.app",
  credentials: true,
}));

app.use(express.json());

// Enable sessions
app.use(session({
  secret: 'immersilearn_secret',
  resave: false,
  saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', require('./routes/auth')); // Your existing auth routes
app.use('/auth', require('./routes/googleAuth')); // New Google auth route

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

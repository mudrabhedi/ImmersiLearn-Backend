const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const OpenAI = require('openai');

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
// Session Configuration
// =====================
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://immersi-learn.vercel.app'], // Update this with your front-end origin
  credentials: true
}));

// =====================
// OpenAI (Gemini) API Helper
// =====================
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY, // Replace with your Gemini API Key
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

// =====================
// AI Tutor Route
// =====================
app.post('/api/ask', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Request to Gemini API (using OpenAI library)
    const response = await openai.chat.completions.create({
      model: 'gemini-2.0-flash',  // Model to use for Gemini
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...messages
      ]
    });

    res.json({
      answer: response.choices[0].message.content
    });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({
      error: 'Failed to process your question',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      geminiAPI: !!process.env.GEMINI_API_KEY ? 'available' : 'unconfigured'
    }
  });
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Gemini API ${process.env.GEMINI_API_KEY ? 'enabled' : 'disabled'}`);
});

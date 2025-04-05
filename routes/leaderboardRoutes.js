const express = require('express');
const Leaderboard = require('../models/Leaderboard');
const router = express.Router();

// Dummy data for the leaderboard
const dummyData = [
  { username: 'John Doe', score: 100 },
  { username: 'Jane Smith', score: 90 },
  { username: 'Alice Johnson', score: 85 },
  { username: 'Bob Brown', score: 80 },
  { username: 'Charlie Davis', score: 75 },
  { username: 'David Evans', score: 70 },
  { username: 'Eve Green', score: 65 },
  { username: 'Frank Harris', score: 60 },
  { username: 'Grace King', score: 55 },
  { username: 'Hannah Lee', score: 50 }
];

// Initialize the leaderboard collection with dummy data if it's empty
async function initializeLeaderboard() {
  const count = await Leaderboard.countDocuments();
  if (count === 0) {
    console.log('Populating leaderboard with dummy data...');
    await Leaderboard.insertMany(dummyData);
  }
}

// Get all leaderboards (top 10)
router.get('/', async (req, res) => {
  try {
    await initializeLeaderboard(); // Ensure dummy data is populated if the DB is empty
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new score
router.post('/', async (req, res) => {
    const { username, score } = req.body;
  
    try {
      const newScore = new Leaderboard({ username, score });
      await newScore.save();
      
      // Get updated top 10 leaderboard
      const updatedLeaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
      
      res.status(201).json(updatedLeaderboard);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

module.exports = router;


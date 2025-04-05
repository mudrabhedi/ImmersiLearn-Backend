const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Helper function
function calculateLevel(points) {
  if (points < 100) return 1;
  if (points < 500) return 2;
  if (points < 1000) return 3;
  return 4;
}

// Get user progress
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      level: user.level,
      points: user.points,
      rewards: user.rewards || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update points
router.post('/update-points/:userId', async (req, res) => {
  try {
    const { pointsEarned } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.points += pointsEarned;
    user.level = calculateLevel(user.points);

    // Add rewards
    if (user.points >= 100 && !user.rewards.includes('Level 2')) {
      user.rewards.push('Congrats! You unlocked Level 2!');
    }
    if (user.points >= 500 && !user.rewards.includes('Level 3')) {
      user.rewards.push('Congrats! You unlocked Level 3!');
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
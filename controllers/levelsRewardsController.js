const User = require('../models/User'); 
exports.getLevelsAndRewards = async (req, res) => {
    try {
      const user = await User.findById(req.user.id); // Assumes authentication middleware is set up
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
  
      // Send back level, progress, and rewards data
      res.json({
        level: user.level,
        levelProgress: user.levelProgress,
        rewards: user.rewards, // Rewards stored in the user document
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  };
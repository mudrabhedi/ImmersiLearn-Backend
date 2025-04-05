const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20
});

// User Authentication
router.post('/signup', authLimiter, authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);

// Professor Authentication
router.post('/signup-professor', authLimiter, authController.registerProfessor);
router.post('/login-professor', authLimiter, authController.loginProfessor);

// Google OAuth Routes (only enable if configured)
if (process.env.GOOGLE_CLIENT_ID) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      res.redirect('/');
    }
  );
} else {
  console.warn('Google OAuth disabled - missing GOOGLE_CLIENT_ID');
}

module.exports = router;
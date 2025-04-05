const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const router = express.Router();

// Load environment variables from .env file
dotenv.config();

// Initialize Google OAuth strategy
passport.use(new (require('passport-google-oauth20').Strategy)({
  clientID: process.env.GOOGLE_CLIENT_ID, // Replace with your actual Client ID
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Replace with your actual Client Secret
  callbackURL: 'https://yourdomain.com/google/callback', // Replace with your actual callback URL
}, (token, tokenSecret, profile, done) => {
  // The profile contains user's data from Google
  return done(null, profile);
}));

// Start Google OAuth flow
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Handle Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // JWT generation (customize payload if needed)
    const user = req.user;
    const payload = { userId: user.id, email: user.emails[0].value };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });  // Use a secure secret key

    // Send JWT as part of URL for frontend to store
    res.redirect(`https://yourfrontend.com/subjects?token=${token}`); // Replace with your frontend URL
  }
);

module.exports = router;

// passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Verify callback function
const verifyCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    // Here you would typically find or create a user in your database
    const user = {
      googleId: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0].value
    };
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

// Initialize Google Strategy only if clientID exists
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      verifyCallback
    )
  );
} else {
  console.warn('⚠️ Google OAuth disabled - missing GOOGLE_CLIENT_ID');
}

// Serialize/deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
module.exports = passport;
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

const hasGoogleCreds = clientID && 
                       clientSecret && 
                       clientID !== 'your-google-client-id' && 
                       clientSecret !== 'your-google-client-secret';

if (hasGoogleCreds) {
  passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // Update tokens
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }

      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value || '',
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        role: 'Sales Executive',
        status: 'Active',
        lastLogin: new Date()
      });

      await user.save();
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
} else {
  console.warn('Google OAuth credentials not configured. Google Sign-In is disabled.');
}

module.exports = passport;

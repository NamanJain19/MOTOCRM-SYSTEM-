const User = require('../models/User');
const Settings = require('../models/Settings');
const passport = require('passport');

// Get Login Page
exports.getLoginPage = (req, res) => {
  const googleLoginEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret'
  );
  
  let errorMessage = null;
  if (req.query.error === 'google_disabled') {
    errorMessage = 'Google Sign-In is currently disabled. Please use your email and password.';
  } else if (req.query.error === 'google_auth_failed') {
    errorMessage = 'Google authentication failed. Please try again.';
  } else if (req.query.error === 'session_error') {
    errorMessage = 'An error occurred during session creation. Please try again.';
  }

  res.render('auth/login', { 
    title: 'Login - MotoCRM Pro',
    googleLoginEnabled,
    errorMessage
  });
};

// Get Register Page
exports.getRegisterPage = (req, res) => {
  res.render('auth/register', { title: 'Register - MotoCRM Pro' });
};

// Handle Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is inactive' });
    }

    // Store user info and settings in session
    const settings = await Settings.findOne({ userId: user._id });
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    req.session.userPhone = user.phone || '';
    req.session.userAvatar = user.avatar || '';
    req.session.sessionTimeout = settings ? settings.sessionTimeout : 3600;

    // Update last login
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    res.json({ success: true, redirect: '/' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Handle Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'Sales Executive'
    });

    await newUser.save();

    // Create default settings for user
    const settings = new Settings({
      userId: newUser._id,
      dealershipName: 'MotoCRM Pro',
      dealershipLocation: 'New York',
      theme: 'light'
    });

    await settings.save();

    // Automatically log in the user
    req.session.userId = newUser._id;
    req.session.userName = newUser.name;
    req.session.userEmail = newUser.email;
    req.session.userRole = newUser.role;
    req.session.userPhone = newUser.phone || '';
    req.session.userAvatar = newUser.avatar || '';
    req.session.sessionTimeout = 3600; // default

    res.json({ success: true, redirect: '/' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Handle Logout
exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.json({ success: true, redirect: '/auth/login' });
  });
};

// Get Current User
exports.getCurrentUser = (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
      role: req.session.userRole
    }
  });
};

// Memory store for mock reset tokens
const mockTokens = new Map();

// GET Forgot Password Page
exports.getForgotPasswordPage = (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password - MotoCRM Pro' });
};

// POST Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'No user registered with this email address' });
    }

    // Generate a mock reset token
    const token = 'token-' + Math.random().toString(36).substring(2, 15);
    mockTokens.set(token, user.email);

    // Simulated email dispatch
    console.log(`[SMTP SIMULATOR] Password reset requested for ${user.email}. URL: http://localhost:3000/auth/reset-password/${token}`);

    res.json({ 
      success: true, 
      message: 'A password reset link has been generated successfully!',
      resetUrl: `/auth/reset-password/${token}` // Pass back to UI for direct demonstration redirect
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error requesting password reset' });
  }
};

// GET Reset Password Page
exports.getResetPasswordPage = (req, res) => {
  const { token } = req.params;
  const email = mockTokens.get(token);
  if (!email) {
    return res.render('auth/reset-password', { 
      title: 'Reset Password - MotoCRM Pro', 
      token,
      error: 'Invalid or expired reset token.'
    });
  }
  res.render('auth/reset-password', { title: 'Reset Password - MotoCRM Pro', token, error: null });
};

// POST Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const email = mockTokens.get(token);
    if (!email) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User no longer exists' });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    await user.save();

    // Remove token
    mockTokens.delete(token);

    res.json({ success: true, message: 'Password has been reset successfully! Redirecting to login...' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

// Google OAuth Routes
exports.googleAuth = (req, res, next) => {
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && 
                         process.env.GOOGLE_CLIENT_SECRET && 
                         process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
                         process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret';
  if (!hasGoogleCreds) {
    console.warn('Google Login attempted but credentials are not configured.');
    return res.redirect('/auth/login?error=google_disabled');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

exports.googleCallback = (req, res, next) => {
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && 
                         process.env.GOOGLE_CLIENT_SECRET && 
                         process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
                         process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret';
  if (!hasGoogleCreds) {
    console.warn('Google Login callback attempted but credentials are not configured.');
    return res.redirect('/auth/login?error=google_disabled');
  }

  passport.authenticate('google', async (err, user) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect('/auth/login?error=google_auth_failed');
    }

    if (!user) {
      return res.redirect('/auth/login?error=google_auth_failed');
    }

    try {
      // Create settings for user if they don't exist
      let settings = await Settings.findOne({ userId: user._id });
      if (!settings) {
        settings = new Settings({
          userId: user._id,
          dealershipName: 'MotoCRM Pro',
          dealershipLocation: 'New York',
          theme: 'dark'
        });
        await settings.save();
      }

      // Store user info in session
      req.session.userId = user._id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;
      req.session.userPhone = user.phone || '';
      req.session.userAvatar = user.avatar || '';
      req.session.sessionTimeout = settings ? settings.sessionTimeout : 3600;

      // Update last login
      await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

      // Redirect to dashboard
      res.redirect('/');
    } catch (error) {
      console.error('Session creation error:', error);
      res.redirect('/auth/login?error=session_error');
    }
  })(req, res, next);
};

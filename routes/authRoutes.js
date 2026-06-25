const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isNotAuthenticated, isAuthenticated } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

// Login routes
router.get('/login', isNotAuthenticated, authController.getLoginPage);
router.post('/login', isNotAuthenticated, validateLogin, authController.login);

// Register routes
router.get('/register', isNotAuthenticated, authController.getRegisterPage);
router.post('/register', isNotAuthenticated, validateRegister, authController.register);

// Forgot Password routes
router.get('/forgot-password', isNotAuthenticated, authController.getForgotPasswordPage);
router.post('/forgot-password', isNotAuthenticated, authController.forgotPassword);

// Reset Password routes
router.get('/reset-password/:token', isNotAuthenticated, authController.getResetPasswordPage);
router.post('/reset-password/:token', isNotAuthenticated, authController.resetPassword);

// Google Sign-In (OAuth) routes
router.get('/google', isNotAuthenticated, authController.googleAuth);
router.get('/google/callback', isNotAuthenticated, authController.googleCallback);

// Logout route
router.post('/logout', isAuthenticated, authController.logout);

// Get current user info
router.get('/me', authController.getCurrentUser);

module.exports = router;

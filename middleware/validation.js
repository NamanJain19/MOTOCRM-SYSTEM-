const { body, validationResult, query } = require('express-validator');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    } else {
      if (req.originalUrl && req.originalUrl.startsWith('/settings')) {
        let tab = 'dealership-profile';
        if (req.originalUrl.includes('crm-config')) tab = 'crm-configurations';
        if (req.originalUrl.includes('security')) tab = 'security';
        return res.redirect(`/settings?tab=${tab}&error=validation`);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    }
  }
  next();
};


// Lead Validation Rules
const validateLead = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone must contain only numbers, spaces, and symbols'),
  
  body('email')
    .trim()
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Invalid email format'),
  
  body('bikeModel')
    .trim()
    .notEmpty().withMessage('Bike model is required')
    .isLength({ min: 2 }).withMessage('Bike model must be at least 2 characters'),
  
  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('leadSource')
    .notEmpty().withMessage('Lead source is required')
    .isIn(['WhatsApp', 'Facebook', 'Instagram', 'Website', 'Walk-in', 'Referral'])
    .withMessage('Invalid lead source'),
  
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Delivered', 'Lost'])
    .withMessage('Invalid status'),
  
  body('targetBudget')
    .optional()
    .isInt({ min: 0 }).withMessage('Budget must be a positive number'),
  
  handleValidationErrors
];

// User Login Validation
const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  handleValidationErrors
];

// User Registration Validation
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'Sales Executive'])
    .withMessage('Invalid role'),
  
  handleValidationErrors
];

// Settings Validation
const validateSettings = [
  body('dealershipName')
    .trim()
    .optional()
    .isLength({ min: 2 }).withMessage('Dealership name must be at least 2 characters'),
  
  body('dealershipLocation')
    .trim()
    .optional()
    .isLength({ min: 5 }).withMessage('Location must be at least 5 characters'),
  
  body('dealershipPhone')
    .trim()
    .optional()
    .matches(/^[\d\s\-\+\(\)]*$/).withMessage('Phone must contain only numbers and symbols'),
  
  body('dealershipEmail')
    .trim()
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Invalid email format'),
  
  handleValidationErrors
];

// Task Validation
const validateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  
  body('dueDate')
    .trim()
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('priority')
    .optional()
    .isIn(['URGENT', 'HIGH', 'NORMAL'])
    .withMessage('Invalid priority'),
  
  handleValidationErrors
];

module.exports = {
  validateLead,
  validateLogin,
  validateRegister,
  validateSettings,
  validateTask,
  handleValidationErrors
};

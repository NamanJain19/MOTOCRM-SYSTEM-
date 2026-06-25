const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const session = require('express-session');
const connectDB = require('./config/db');
const { setUserLocals } = require('./middleware/auth');
const passport = require('./config/passport');

// Connect to Database
connectDB();

const app = express();

// Set View Engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'motocrm-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Dynamic Session Expiration Middleware based on Settings
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const timeout = req.session.sessionTimeout || 3600; // in seconds
    req.session.cookie.maxAge = timeout * 1000;
  }
  next();
});

// Set local variables for views (current path for highlighting menu items)
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// Set user info in res.locals for views
app.use(setUserLocals);

// Route Imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const leadRoutes = require('./routes/leadRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const testRideRoutes = require('./routes/testRideRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const smsRoutes = require('./routes/smsRoutes');

// Mount Routes
app.use('/auth', authRoutes);
app.use('/', dashboardRoutes);
app.use('/leads', leadRoutes);
app.use('/follow-ups', followUpRoutes);
app.use('/reports', reportRoutes);
app.use('/settings', settingsRoutes);
app.use('/pipeline', pipelineRoutes);
app.use('/test-rides', testRideRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/deliveries', deliveryRoutes);
app.use('/api/sms', smsRoutes);

// Test Twilio SMS Endpoint
const smsService = require('./services/smsService');
app.post('/api/test-sms', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message" in request body' });
  }

  try {
    const result = await smsService.sendSMS(to, message);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Error Handling Middleware
app.use((req, res, next) => {
  res.status(404).render('dashboard', {
    title: '404 - Not Found',
    stats: { 
      totalLeads: 0, 
      newLeads: 0, 
      interestedLeads: 0, 
      testRides: 0, 
      soldBikes: 0, 
      convRate: '0%',
      totalLeadsChange: 'Stable —',
      newLeadsChange: 'Stable —',
      soldBikesChange: 'Stable —'
    },
    recentActivities: [],
    donutData: { WhatsApp: 0, Facebook: 0, Instagram: 0, Website: 0, 'Walk-in': 0, Referral: 0 },
    monthlyLeads: [],
    salesPerformance: [],
    upcomingTestRides: [],
    completedTestRidesCount: 0,
    inventorySummary: { totalModels: 0, totalStock: 0, totalReserved: 0, totalSold: 0, lowStockCount: 0 },
    lowStockAlerts: []
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the application.`);
});

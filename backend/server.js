// ==============================================
// HabitSync Backend - Express Server
// ==============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const admin = require('firebase-admin');

const app = express();

// ============================================
// Middleware
// ============================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'habitsync-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ============================================
// Firebase Admin Setup
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBVizMs2008bavqmB5cQVeYiGOZFuFewDU",
  authDomain: "habitsync-455d3.firebaseapp.com",
  projectId: "habitsync-455d3",
  storageBucket: "habitsync-455d3.firebasestorage.app",
  messagingSenderId: "861608812567",
  appId: "1:861608812567:web:628f74d182db113b4abc52"
};

// Initialize Firebase Admin (requires service account key)
// For now, we'll use Firebase Web SDK through HTTP calls
console.log("Firebase configured for habitsync-455d3 project");

// ============================================
// Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Session verification
app.get('/api/auth/verify', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      userId: req.session.userId,
      email: req.session.email
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// Store user session after Firebase auth
app.post('/api/auth/login', (req, res) => {
  const { userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Store in session
  req.session.userId = userId;
  req.session.email = email || '';
  req.session.loginTime = new Date();

  console.log(`User logged in: ${userId}`);

  res.json({
    success: true,
    message: 'Session created',
    userId: userId
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const userId = req.session.userId;
  console.log(`Logout request for user: ${userId}`);
  
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    // Clear the session cookie completely
    res.clearCookie('connect.sid', { path: '/' });
    
    console.log(`User logged out successfully: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Logged out successfully',
      userId: userId
    });
  });
});

// Get user habits
app.get('/api/habits/:userId', (req, res) => {
  const userId = req.params.userId;

  // Verify session
  if (req.session.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Get from localStorage via frontend (or implement database)
  res.json({
    userId: userId,
    habits: [] // Frontend manages this via localStorage
  });
});

// Save habit
app.post('/api/habits/:userId', (req, res) => {
  const userId = req.params.userId;
  const { habit } = req.body;

  // Verify session
  if (req.session.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // TODO: Save to database
  console.log(`Habit saved for user ${userId}:`, habit);

  res.json({
    success: true,
    message: 'Habit saved',
    habit: habit
  });
});

// Update habit
app.put('/api/habits/:userId/:habitId', (req, res) => {
  const userId = req.params.userId;
  const habitId = req.params.habitId;
  const { updates } = req.body;

  // Verify session
  if (req.session.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  console.log(`Habit updated for user ${userId}:`, habitId, updates);

  res.json({
    success: true,
    message: 'Habit updated',
    habitId: habitId
  });
});

// Delete habit
app.delete('/api/habits/:userId/:habitId', (req, res) => {
  const userId = req.params.userId;
  const habitId = req.params.habitId;

  // Verify session
  if (req.session.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  console.log(`Habit deleted for user ${userId}:`, habitId);

  res.json({
    success: true,
    message: 'Habit deleted',
    habitId: habitId
  });
});

// Get user stats
app.get('/api/stats/:userId', (req, res) => {
  const userId = req.params.userId;

  // Verify session
  if (req.session.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json({
    userId: userId,
    totalHabits: 0,
    completedToday: 0,
    averageStreak: 0,
    longestStreak: 0
  });
});

// ============================================
// Error Handling
// ============================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     HabitSync Backend Server           ║
║     Running on port ${PORT}             ║
║     Environment: ${process.env.NODE_ENV || 'development'}         ║
╚════════════════════════════════════════╝
  `);
  console.log(`✓ CORS enabled for localhost`);
  console.log(`✓ Firebase configured`);
  console.log(`✓ Session management active`);
});

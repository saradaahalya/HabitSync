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
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  Origin: ${req.get('origin')}`);
  console.log(`  Cookies: ${req.get('cookie') || 'none'}`);
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'habitsync-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: false, // Changed to false so JS can verify
    sameSite: 'lax', // Allow cross-origin requests
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Session logging middleware
app.use((req, res, next) => {
  if (req.session.userId) {
    console.log(`  ✓ Session user: ${req.session.userId}`);
  } else {
    console.log(`  ✗ No session`);
  }
  next();
});

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
// In-Memory Storage (temporary - for testing)
// ============================================

const habitsStore = {}; // { userId: { habitId: { name, description, frequency, streak, createdAt, lastCheckIn } } }

// ============================================
// Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Debug endpoint - check current session
app.get('/api/debug/session', (req, res) => {
  console.log(`  [DEBUG] Session data:`);
  console.log(`    ID: ${req.sessionID}`);
  console.log(`    User: ${req.session.userId || 'none'}`);
  console.log(`    All cookies received: ${JSON.stringify(req.cookies)}`);
  
  res.json({
    sessionId: req.sessionID,
    userId: req.session.userId || null,
    email: req.session.email || null,
    cookieHeader: req.get('cookie') || 'none',
    allSessionData: req.session
  });
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
    console.log('  ✗ Login error: userId is required');
    return res.status(400).json({ error: 'userId is required' });
  }

  // Store in session
  req.session.userId = userId;
  req.session.email = email || '';
  req.session.loginTime = new Date();

  console.log(`  → Setting session for user: ${userId}`);
  console.log(`  → Session ID will be: ${req.sessionID}`);

  res.json({
    success: true,
    message: 'Session created',
    userId: userId,
    sessionId: req.sessionID
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
    console.log(`Unauthorized GET /api/habits attempt: session=${req.session.userId}, requested=${userId}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Return habits from in-memory store
  const userHabits = habitsStore[userId] || {};
  const habitsArray = Object.values(userHabits);
  
  console.log(`Fetching ${habitsArray.length} habits for user ${userId}`);
  
  res.json({
    userId: userId,
    habits: habitsArray
  });
});

// Save habit
app.post('/api/habits/:userId', (req, res) => {
  const userId = req.params.userId;
  const { name, description, frequency } = req.body;

  // Verify session
  if (req.session.userId !== userId) {
    console.log(`Unauthorized POST /api/habits attempt: session=${req.session.userId}, requested=${userId}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Validate input
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Habit name is required' });
  }

  // Generate habit ID
  const habitId = Date.now().toString();
  
  // Initialize user's habit store if not exists
  if (!habitsStore[userId]) {
    habitsStore[userId] = {};
  }

  // Create habit object
  const habit = {
    id: habitId,
    name: name.trim(),
    description: description || '',
    frequency: frequency || 'daily',
    streak: 0,
    createdAt: new Date().toISOString(),
    lastCheckIn: null
  };

  // Store habit
  habitsStore[userId][habitId] = habit;

  console.log(`Habit created for user ${userId}:`, habit);

  res.json({
    success: true,
    message: 'Habit created',
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
    console.log(`Unauthorized DELETE /api/habits attempt: session=${req.session.userId}, requested=${userId}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Check if user has habits
  if (!habitsStore[userId] || !habitsStore[userId][habitId]) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  // Delete habit
  delete habitsStore[userId][habitId];

  console.log(`Habit deleted for user ${userId}:`, habitId);

  res.json({
    success: true,
    message: 'Habit deleted',
    habitId: habitId
  });
});

// Check in habit
app.post('/api/habits/:userId/:habitId/checkin', (req, res) => {
  const userId = req.params.userId;
  const habitId = req.params.habitId;

  // Verify session
  if (req.session.userId !== userId) {
    console.log(`Unauthorized POST /api/habits/checkin attempt: session=${req.session.userId}, requested=${userId}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Check if habit exists
  if (!habitsStore[userId] || !habitsStore[userId][habitId]) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  // Update habit
  const habit = habitsStore[userId][habitId];
  habit.streak = (habit.streak || 0) + 1;
  habit.lastCheckIn = new Date().toISOString();

  console.log(`Check-in for habit ${habitId} by user ${userId}. New streak: ${habit.streak}`);

  res.json({
    success: true,
    message: 'Check-in recorded',
    habitId: habitId,
    streak: habit.streak,
    checkedInAt: habit.lastCheckIn
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

// ==============================================
// HabitSync Backend - Express Server
// ==============================================
import "dotenv/config";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import admin from "firebase-admin";
import pkg from "@prisma/client";


const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const app = express();

// ============================================
// Middleware
// ============================================

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools and localhost dev clients on any port.
    if (!origin) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
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
    httpOnly: true,//nged to false so JS can verify
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

const getSessionUserId = (req) => {
  const sessionUserId = Number(req.session.userId);
  return Number.isInteger(sessionUserId) ? sessionUserId : null;
};

// Store user session after Firebase auth
app.post('/api/auth/login', async (req, res) => {
  const { userId: firebaseUid, email, displayName } = req.body;

  if (!firebaseUid || !email) {
    console.log('  ✗ Login error: firebase userId and email are required');
    return res.status(400).json({ error: 'firebase userId and email are required' });
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firebaseUid,
        name: displayName || undefined
      },
      create: {
        email,
        firebaseUid,
        name: displayName || null
      }
    });

    // Store numeric DB user ID in session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.loginTime = new Date();

    console.log(`  → Session set for DB user: ${user.id} (firebase: ${firebaseUid})`);
    console.log(`  → Session ID will be: ${req.sessionID}`);

    res.json({
      success: true,
      message: 'Session created',
      userId: user.id,
      firebaseUid,
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Login session create error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
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
     
    });
  });
});

// ============================================
// Habit Routes (Prisma Integration)
// ============================================

// Get user habits
app.get('/api/habits/:userId', async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    if (!sessionUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get habits from database
    const habits = await prisma.habit.findMany({
      where: { userId: sessionUserId },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      }
    });

    console.log(`Fetching ${habits.length} habits for user ${sessionUserId}`);

    res.json({
     
      habits: habits
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});
;
// Create habit
app.post('/api/habits/:userId', async (req, res) => {
  console.log("🔥 CREATE HABIT HIT");
  console.log("Body:", req.body);
  console.log("Params:", req.params);


  try {
    const sessionUserId = getSessionUserId(req);
    const { title, description, category, frequency, weeklyGoal } = req.body;

    if (!sessionUserId) {
      console.log(`Unauthorized POST /api/habits attempt: session=${req.session.userId}`)
      return res.status(403).json({ error: 'Unauthorized' })
     
}

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Habit title is required' });
    }

    const parsedWeeklyGoal = Number(weeklyGoal);
    const safeWeeklyGoal = Number.isInteger(parsedWeeklyGoal) && parsedWeeklyGoal > 0
      ? parsedWeeklyGoal
      : 7;

    // Create habit in database
    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        description: description || '',
        category: category || '',
        frequency: frequency || 'daily',
        weeklyGoal: safeWeeklyGoal,
        userId: sessionUserId
      }
    });

    console.log(`Habit created for user ${sessionUserId}:`, habit);

    res.json({
      success: true,
      message: 'Habit created',
      habit: habit
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Update habit
app.put('/api/habits/:userId/:habitId', async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const habitId = req.params.habitId;
    const { title, description, category, frequency, weeklyGoal } = req.body;
    const parsedWeeklyGoal = Number(weeklyGoal);
    const safeWeeklyGoal = Number.isInteger(parsedWeeklyGoal) && parsedWeeklyGoal > 0
      ? parsedWeeklyGoal
      : undefined;

    if (!sessionUserId) {
       console.log(`Unauthorized attempt: session=${req.session.userId}`);
       return res.status(403).json({ error: 'Unauthorized' });
    }

    const existingHabit = await prisma.habit.findUnique({
      where: { id: parseInt(habitId) }
    });
    if (!existingHabit || existingHabit.userId !== sessionUserId) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Update habit in database
    const habit = await prisma.habit.update({
      where: {
        id: parseInt(habitId),
      },
      data: {
        title: title || undefined,
        description: description,
        category: category,
        frequency: frequency,
        weeklyGoal: safeWeeklyGoal
      }
    });

    console.log(`Habit updated for user ${sessionUserId}:`, habitId);

    res.json({
      success: true,
      message: 'Habit updated',
      habit: habit
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Habit not found' });
    } else {
      res.status(500).json({ error: 'Failed to update habit' });
    }
  }
});

// Delete habit
app.delete('/api/habits/:userId/:habitId', async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const habitId = req.params.habitId;

    if (!sessionUserId) {
      console.log(`Unauthorized attempt: session=${req.session.userId}`);
       return res.status(403).json({ error: 'Unauthorized' });
    }

    const existingHabit = await prisma.habit.findUnique({
      where: { id: parseInt(habitId) }
    });
    if (!existingHabit || existingHabit.userId !== sessionUserId) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Delete habit from database (cascade will delete logs)
    await prisma.habit.delete({
      where: {
          id: parseInt(habitId),
      }

    });

    console.log(`Habit deleted for user ${sessionUserId}:`, habitId);

    res.json({
      success: true,
      message: 'Habit deleted',
      habitId: habitId
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Habit not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete habit' });
    }
  }
});

// Check in habit (create log entry)
app.post('/api/habits/:userId/:habitId/checkin', async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const habitId = req.params.habitId;
    const { date, notes, durationMinutes } = req.body;

    if (!sessionUserId) {
       console.log(`Unauthorized attempt: session=${req.session.userId}`);
       return res.status(403).json({ error: 'Unauthorized' });
    }

    const existingHabit = await prisma.habit.findUnique({
      where: { id: parseInt(habitId) }
    });
    if (!existingHabit || existingHabit.userId !== sessionUserId) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const checkinDate = date ? new Date(date) : new Date();
    const parsedDurationMinutes = Number(durationMinutes);
    const safeDurationMinutes = Number.isFinite(parsedDurationMinutes) && parsedDurationMinutes >= 0
      ? Math.floor(parsedDurationMinutes)
      : 0;

    // Create habit log entry
    const log = await prisma.habitLog.create({
      data: {
        habitId: parseInt(habitId),
        date: checkinDate,
        completed: true,
        durationMinutes: safeDurationMinutes,
        notes: notes || ''
      }
    });

    console.log(`Habit check-in for user ${sessionUserId}, habit ${habitId}:`, log);

    res.json({
      success: true,
      message: 'Habit checked in',
      log: log
    });
  } catch (error) {
    console.error('Error checking in habit:', error);
    res.status(500).json({ error: 'Failed to check in habit' });
  }
});

// Get user stats
app.get('/api/stats/:userId', async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    if (!sessionUserId) {
      console.log(`Unauthorized attempt: session=${req.session.userId}`);
       return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get habit statistics from database
    const habits = await prisma.habit.findMany({
      where: { userId: sessionUserId },
      include: {
        logs: {
          where: {
            completed: true,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
          }
        }
      }
    });

    const totalHabits = habits.length;
    const completedToday = habits.filter(habit => {
      const todayLog = habit.logs.find(log =>
        log.date.toDateString() === new Date().toDateString()
      );
      return todayLog && todayLog.completed;
    }).length;

    // Calculate average streak (simplified)
    const averageStreak = habits.length > 0 ?
      habits.reduce((sum, habit) => sum + habit.logs.length, 0) / habits.length : 0;

    const longestStreak = habits.length > 0 ?
      Math.max(...habits.map(habit => habit.logs.length)) : 0;

    res.json({
     
      totalHabits: totalHabits,
      completedToday: completedToday,
      averageStreak: Math.round(averageStreak),
      longestStreak: longestStreak
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
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

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import pkg from "@prisma/client";
import chatRoutes from "./routes/chat.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "habitsync-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

const getSessionUserId = (req) => {
  const sessionUserId = Number(req.session.userId);
  return Number.isInteger(sessionUserId) ? sessionUserId : null;
};

app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/api/auth/verify", (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      userId: req.session.userId,
      email: req.session.email,
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { userId: firebaseUid, email, displayName } = req.body;

  if (!firebaseUid || !email) {
    return res.status(400).json({
      error: "firebase userId and email are required",
    });
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firebaseUid,
        name: displayName || undefined,
        lastActiveDate: new Date(),
      },
      create: {
        email,
        firebaseUid,
        name: displayName || null,
        lastActiveDate: new Date(),
      },
    });

    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.loginTime = new Date();

    res.json({
      success: true,
      message: "Session created",
      userId: user.id,
      firebaseUid,
      sessionId: req.sessionID,
    });
  } catch (error) {
    console.error("Login session create error:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("connect.sid", { path: "/" });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

app.get("/api/habits/:userId", async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);

    if (!sessionUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: sessionUserId },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    res.json({ habits });
  } catch (error) {
    console.error("Error fetching habits:", error);
    res.status(500).json({ error: "Failed to fetch habits" });
  }
});

app.post("/api/habits/:userId", async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const { title, description, category, frequency, weeklyGoal } = req.body;

    if (!sessionUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Habit title is required" });
    }

    const parsedWeeklyGoal = Number(weeklyGoal);
    const safeWeeklyGoal =
      Number.isInteger(parsedWeeklyGoal) && parsedWeeklyGoal > 0
        ? parsedWeeklyGoal
        : 7;

    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        description: description || "",
        category: category || "",
        frequency: frequency || "daily",
        weeklyGoal: safeWeeklyGoal,
        userId: sessionUserId,
      },
    });

    res.json({
      success: true,
      message: "Habit created",
      habit,
    });
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ error: "Failed to create habit" });
  }
});

app.put("/api/habits/:userId/:habitId", async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const habitId = parseInt(req.params.habitId);
    const { title, description, category, frequency, weeklyGoal } = req.body;

    if (!sessionUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!existingHabit || existingHabit.userId !== sessionUserId) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const parsedWeeklyGoal = Number(weeklyGoal);
    const safeWeeklyGoal =
      Number.isInteger(parsedWeeklyGoal) && parsedWeeklyGoal > 0
        ? parsedWeeklyGoal
        : undefined;

    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        title: title || undefined,
        description,
        category,
        frequency,
        weeklyGoal: safeWeeklyGoal,
      },
    });

    res.json({
      success: true,
      message: "Habit updated",
      habit,
    });
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
});

app.delete("/api/habits/:userId/:habitId", async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const habitId = parseInt(req.params.habitId);

    if (!sessionUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!existingHabit || existingHabit.userId !== sessionUserId) {
      return res.status(404).json({ error: "Habit not found" });
    }

    await prisma.habit.delete({
      where: { id: habitId },
    });

    res.json({
      success: true,
      message: "Habit deleted",
      habitId,
    });
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

app.post("/api/habits/:userId/:habitId/checkin", async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);
    const habitId = parseInt(req.params.habitId);
    const { notes, durationMinutes } = req.body;

    if (!sessionUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!existingHabit || existingHabit.userId !== sessionUserId) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedDurationMinutes = Number(durationMinutes);
    const safeDurationMinutes =
      Number.isFinite(parsedDurationMinutes) && parsedDurationMinutes >= 0
        ? Math.floor(parsedDurationMinutes)
        : 0;

    const lastLog = await prisma.habitLog.findFirst({
      where: { habitId },
      orderBy: { date: "desc" },
    });

    let newStreak = 1;

    if (lastLog) {
      const lastDate = new Date(lastLog.date);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        newStreak = (existingHabit.streak || 0) + 1;
      } else if (diffDays === 0) {
        return res.json({
          success: true,
          message: "Already checked in today",
          streak: existingHabit.streak,
        });
      } else {
        newStreak = 1;
      }
    }

    const log = await prisma.habitLog.create({
      data: {
        habitId,
        date: today,
        completed: true,
        durationMinutes: safeDurationMinutes,
        notes: notes || "",
      },
    });

    await prisma.habit.update({
      where: { id: habitId },
      data: {
        streak: newStreak,
      },
    });

    await prisma.user.update({
      where: { id: sessionUserId },
      data: {
        lastActiveDate: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Habit checked in",
      streak: newStreak,
      log,
    });
  } catch (error) {
    console.error("Error checking in habit:", error);
    res.status(500).json({ error: "Failed to check in habit" });
  }
});

app.get("/api/stats/:userId", async (req, res) => {
  try {
    const sessionUserId = getSessionUserId(req);

    if (!sessionUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: sessionUserId },
      include: {
        logs: {
          where: {
            completed: true,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
      },
    });

    const totalHabits = habits.length;

    const completedToday = habits.filter((habit) => {
      const todayLog = habit.logs.find(
        (log) => log.date.toDateString() === new Date().toDateString()
      );
      return todayLog && todayLog.completed;
    }).length;

    const averageStreak =
      habits.length > 0
        ? habits.reduce((sum, habit) => sum + habit.logs.length, 0) /
          habits.length
        : 0;

    const longestStreak =
      habits.length > 0 ? Math.max(...habits.map((habit) => habit.logs.length)) : 0;

    res.json({
      totalHabits,
      completedToday,
      averageStreak: Math.round(averageStreak),
      longestStreak,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.use("/api/chat", chatRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     HabitSync Backend Server           ║
║     Running on port ${PORT}             ║
║     Environment: ${process.env.NODE_ENV || "development"}         ║
╚════════════════════════════════════════╝
  `);
});
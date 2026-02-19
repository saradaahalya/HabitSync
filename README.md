# HabitSync - Desktop Habit Tracker

A beautiful, desktop-only habit tracking application built with **vanilla HTML, CSS, and JavaScript**. No frameworks, no dependencies—just pure web technologies with a modern glassmorphism design.

##  Features

 **Multi-page Application** (3 separate HTML files)
- Landing page with glassmorphism design
- Dashboard for habit management
- Stats page with visual progress tracking

 **Habit Management**
- Add habits with name and frequency (Daily/Weekly)
- Edit existing habits inline or via modal
- Delete habits with confirmation
- Manual reset progress button

 **Daily Check-offs**
- Checkbox interface for marking habits complete
- One check per day per habit (prevents duplicates)
- Automatic streak calculation
- Last completion date display

 **Progress Visualization**
- Canvas-based weekly progress bar graph
- 7-day overview showing habits completed per day
- Summary statistics (total habits, completed today, avg streak, longest streak)
- Habit streak leaderboard

 **Data Persistence**
- LocalStorage for all habit data
- Automatic save on every interaction
- Data survives page refresh and browser restart

 **Dark Mode Aesthetic**
- Glassmorphism design system
- Frosted glass cards with backdrop blur
- Neon accent colors (cyan & lime)
- Productivity-focused color palette

##  Project Structure

```
HabitSync/
├── index.html           # Landing page
├── dashboard.html       # Main habit manager
├── stats.html          # Progress visualization
├── styles.css          # Shared styling (dark mode, glassmorphism)
├── dashboard.js        # Dashboard logic (habits CRUD, UI updates)
├── stats.js            # Stats logic (canvas graph, statistics)
└── README.md           # This file
```

##  Quick Start

### Opening the Application

1. **Open in Browser**: Simply open `index.html` in any modern desktop browser
   - No build process needed
   - No server required
   - Works offline (all data stored locally)

2. **Navigation**:
   - Start at the landing page (`index.html`)
   - Click "Go to Dashboard" to begin creating habits
   - Use the navigation bar to move between pages

### Creating Your First Habit

1. Go to Dashboard
2. Fill in the habit name (e.g., "Morning Exercise")
3. Select frequency (Daily or Weekly)
4. Click "Add Habit"
5. The habit appears in your list below

### Tracking Progress

1. Check the checkbox next to a habit to mark it complete for today
2. Your streak counter updates automatically
3. Check-off is locked once per day per habit
4. View your weekly progress on the Stats page

##  LocalStorage Architecture

### Data Structure

```javascript
// All habits stored in localStorage under 'habitsync_habits'
const habit = {
    id: "habit_1708345600000_abc123def",
    name: "Morning Exercise",
    frequency: "Daily",
    streak: 5,                          // Current consecutive days
    completedDays: {
        "2026-02-19": true,
        "2026-02-18": true,
        "2026-02-17": true,
        "2026-02-16": true,
        "2026-02-15": true
    },
    createdAt: "2026-02-15T10:30:00.000Z"
}
```

### Key LocalStorage Methods

- `LocalStorageManager.addHabit(habitData)` - Create new habit
- `LocalStorageManager.updateHabit(id, updates)` - Modify habit
- `LocalStorageManager.deleteHabit(id)` - Remove habit
- `LocalStorageManager.toggleHabitToday(id)` - Mark complete for today
- `LocalStorageManager.isCompletedToday(id)` - Check if completed today
- `LocalStorageManager.calculateStreak(completedDays)` - Compute streak
- `LocalStorageManager.resetHabitProgress(id)` - Clear progress

##  UI/UX Details

### Design System

**Colors:**
- Primary Background: `#0a0e27` (dark blue-black)
- Glass Background: `rgba(19, 24, 41, 0.7)` with 10px blur
- Accent Primary: `#00d4ff` (cyan)
- Accent Secondary: `#00ff88` (lime green)
- Danger: `#ff4444` (red)

**Typography:**
- System font stack for performance
- Responsive sizing (desktop-optimized)
- Clear hierarchy with 6 font sizes

**Components:**
- Glass cards with frosted effect
- Smooth transitions (0.2s - 0.3s)
- Hover states on all interactive elements
- Gradient text on titles

### Dark Mode

All pages use a dark theme by default. No light mode toggle—optimized for productivity and focus.

##  Canvas Graph Logic

### Weekly Progress Chart

Located in `stats.html`, powered by `stats.js`:

```javascript
// Canvas graph visualization logic:
// 1. Fetches completed habits for past 7 days from LocalStorage
// 2. Calculates max habits to determine Y-axis scale
// 3. Draws background grid lines for visual reference
// 4. Renders X and Y axes with labels
// 5. Draws bars for each day (height = habits completed)
// 6. Bar color: cyan (#00d4ff)
// 7. Responsive to window resize
```

**Key Functions:**
- `CanvasGraphManager.getWeeklyData()` - Aggregates 7-day data
- `CanvasGraphManager.drawBars()` - Renders bar chart
- `CanvasGraphManager.drawAxes()` - Draws coordinate system
- `CanvasGraphManager.draw()` - Main orchestration function

##  Streak Calculation Logic

### How Streaks Work

1. **Completion Tracking**: Each habit stores `completedDays` as a date-indexed object
2. **Streak Logic**: Calculated from most recent completion date
3. **Consecutive Days**: Streak = continuous days of completion (can't skip a day)
4. **Recalculation**: Happens when checking/unchecking habits
5. **Reset**: Manual button clears all data for fresh start

```javascript
// Example: If a user completes a habit on:
// Feb 15, Feb 16, Feb 17, Feb 18, Feb 19 → Streak = 5
// But if they skip Feb 17 → Streak resets to 0 from that point
```

### Preventing Multiple Check-offs

```javascript
// toggleHabitToday() checks if today's date exists in completedDays
// If it exists → uncheck (toggle off)
// If it doesn't exist → check (toggle on)
// Prevents duplicate check-offs in same day
```

##  Code Organization

### Separation of Concerns

**HTML (Structure)**
- Pure semantic markup
- No inline styles or scripts
- Clear class names for styling and JS selection

**CSS (Styling)**
- CSS Variables for theming
- Glassmorphism design system
- Responsive grid layouts
- Smooth animations and transitions

**JavaScript (Logic)**
- Modular manager objects (LocalStorageManager, DashboardManager, StatsManager)
- Clear function names explaining intent
- Comprehensive comments on complex logic
- Event-driven architecture
- No global variables (except managers)

### File Responsibilities

**dashboard.js**
- DOM caching
- Event binding
- Form validation
- Habit CRUD operations
- Modal management
- Habit card rendering

**stats.js**
- Canvas graph rendering
- Data aggregation
- Statistics calculations
- Streak visualization

##  React Migration Path

This code is designed to be easily migrated to React:

1. **Manager Objects** → **Custom Hooks** (useHabits, useStats)
2. **HTML Elements** → **React Components** (Dashboard, HabitCard, StatsGraph)
3. **Event Binding** → **Event Props** (onChange, onClick)
4. **DOM Manipulation** → **State & Props** (useState, useEffect)
5. **LocalStorage Access** → **Context API or Custom Hook**

Existing logic remains the same—only the UI layer changes.

##  Browser Compatibility

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

All modern browsers supporting:
- ES6+ JavaScript
- CSS Grid & Flexbox
- Canvas API
- LocalStorage API

##  Notes

- **Desktop-only**: No mobile responsiveness (as requested)
- **No External Dependencies**: Pure vanilla tech stack
- **Offline-First**: All data stored locally in browser
- **Privacy**: No data sent to servers
- **Performance**: Lightweight, fast loading

##  Educational Value

Perfect for learning:
- Vanilla JavaScript patterns
- LocalStorage API
- Canvas API for graphics
- CSS Glassmorphism design
- Object-oriented JavaScript
- Event-driven architecture

##  License

Open source. Feel free to modify and extend!

---

**Built with ❤️ using vanilla HTML, CSS, and JavaScript**

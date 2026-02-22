## 📖 HabitSync - Complete Setup & Usage Guide

### ✅ What's Complete

Your HabitSync application is fully organized into frontend and backend folders with complete functionality:

✅ **Backend Server** - Running on port 5000
- Express.js with full REST API
- Session management
- CORS configured
- Health check endpoint

✅ **Frontend Application** - Ready to serve
- Landing page with Google Sign-In
- Dashboard for habit management
- Stats page with progress visualization
- All styles and logic organized

✅ **Authentication** - Fully functional
- Firebase Google Sign-In
- Session persistence
- Automatic logout

## 🎯 How to Use

### Step 1: Start the Backend (First Terminal)

```bash
cd backend
npm start
```

Expected output:
```
╔════════════════════════════════════════╗
║     HabitSync Backend Server           ║
║     Running on port 5000               ║
║     Environment: development           ║
╚════════════════════════════════════════╝
```

### Step 2: Serve the Frontend (Second Terminal)

Option A - VS Code Live Server (Easiest):
1. Open the `frontend` folder in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Browser opens automatically at `http://127.0.0.1:5500`

Option B - Python HTTP Server:
```bash
cd frontend
python -m http.server 5500
```
Then visit `http://127.0.0.1:5500`

Option C - Node.js HTTP Server:
```bash
cd frontend
npx http-server -p 5500
```
Then visit `http://127.0.0.1:5500`

### Step 3: Access the Application

1. Open browser to `http://127.0.0.1:5500`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Dashboard opens automatically
5. Start creating and tracking habits!

## 🔍 File Organization

### Frontend Folder (`/frontend`)
```
├── index.html          # Landing page - entry point
├── dashboard.html      # Habit management interface
├── stats.html         # Progress visualization
├── styles.css         # All styling (shared across pages)
├── auth.js            # Firebase authentication logic
├── api-client.js      # Backend API communication
├── dashboard.js       # Dashboard functionality
└── stats.js          # Statistics and graph rendering
```

**To serve frontend:**
- Use Live Server, Python, or Node.js HTTP server
- Point to `/frontend` folder
- Access via `http://127.0.0.1:5500`

### Backend Folder (`/backend`)
```
├── server.js          # Express server (starts here)
├── package.json       # Node dependencies
├── .env              # Environment variables
└── node_modules/     # Installed packages
```

**To run backend:**
- Terminal: `cd backend && npm start`
- Server listens on `http://localhost:5000`
- Handles authentication and API requests

## 🌐 Network Paths

### Frontend Addresses (Choose one to serve)
- `http://127.0.0.1:5500` (Live Server default)
- `http://localhost:5500` (alternate)

### Backend Address (Must be running)
- `http://localhost:5000` (for API calls)

**Both must be running simultaneously** for full functionality!

## 📱 Application Flow

1. **User visits `http://127.0.0.1:5500`**
   - Loads landing page (`index.html`)
   - Displays welcome message and feature list

2. **User clicks "Sign in with Google"**
   - Firebase popup opens
   - User authenticates
   - `auth.js` sends login to backend
   - Backend creates session

3. **User enters Dashboard**
   - Loads `dashboard.html`
   - Shows habit list and add form
   - All habits stored in browser's localStorage

4. **User creates habit**
   - Fills form with name and frequency
   - Submitted to LocalStorageManager
   - Habit appears in list immediately

5. **User checks off habits**
   - Clicks checkbox next to habit
   - Streak updates automatically
   - Data persists in localStorage

6. **User views Stats**
   - Loads `stats.html`
   - Canvas graph shows 7-day summary
   - Statistics calculated from habit data

7. **User logs out**
   - Clicks logout button
   - Backend session cleared
   - Firebase signs out
   - Redirected to home
   - Must sign in again to access dashboard

## 🔐 Authentication Details

### How It Works
1. **Firebase handles authentication** - Google Sign-In
2. **Backend maintains sessions** - express-session with 24-hour cookies
3. **Frontend synchronizes** - localStorage + Firebase + backend

### Session Persistence
- **Firebase LOCAL persistence** - keeps auth across browser restart
- **Backend session cookie** - 24-hour expiration
- **localStorage** - stores userId for immediate app access

### Logout Behavior
- Clears backend session
- Clears Firebase authentication
- Clears localStorage userId
- Must sign in again to access dashboard

## 📊 Data Persistence

### Stored Locally (in your browser)
- All habits
- Check-off history
- Streak information
- Completed days

**Key**: `habitsync_habits_{userId}`

This data:
- ✅ Survives page refresh
- ✅ Survives browser restart (Firebase LOCAL persistence)
- ✅ Survives closing tabs (in same browser)
- ❌ NOT shared with other devices
- ❌ Lost if browser cache is cleared

### Backend Sessions
- User authentication
- Session verification
- Prepared for future database integration

## 🛠 Troubleshooting

### "Can't connect to backend" / API errors
**Problem**: Frontend can't reach `http://localhost:5000`

**Solution**:
1. Check if backend is running (terminal showing "Running on port 5000")
2. Check CORS origin in `backend/server.js`
3. Check browser console for specific error
4. Try opening `http://localhost:5000/api/health` directly in browser

### "Google Sign-In not working"
**Problem**: Firebase popup blocked or authentication fails

**Solution**:
1. Allow popups for your domain in browser
2. Check browser console for error code
3. Verify Firebase project credentials in `frontend/auth.js`
4. Ensure domain is authorized in Firebase Console

### "Habits not showing after refresh"
**Problem**: Data lost after browser restart

**Solution**:
1. Check localStorage in browser DevTools (F12 > Application > Storage)
2. Ensure you're logged in (check localStorage for `habitsync_user`)
3. Firebase auth might have expired - sign in again
4. Check for JavaScript errors in console

### "Session expires too quickly"
**Problem**: Keep getting logged out

**Solution**:
1. Backend session expires after 24 hours (default)
2. Check `.env` file: `SESSION_SECRET` is set
3. Restart backend server after changing `.env`

## 🚀 Quick Commands Reference

```bash
# Start backend
cd backend && npm start

# Install backend dependencies (if needed)
cd backend && npm install

# Serve frontend with Python
cd frontend && python -m http.server 5500

# Check backend health
curl http://localhost:5000/api/health

# View backend logs
# Check the terminal window running npm start
```

## 💡 Key Concepts

### Frontend Architecture
- **Vanilla JS** - No frameworks
- **Manager Objects** - LocalStorageManager, DashboardManager, StatsManager
- **Event-Driven** - Listen for user actions and update DOM
- **Modular** - Each file has clear responsibility

### Backend Architecture
- **Express.js** - Lightweight Node.js web server
- **Middleware** - CORS, body-parser, session management
- **REST API** - Standard HTTP routes for data
- **In-Memory Sessions** - Prepared for database integration

### Communication
- **frontend/api-client.js** - Abstract all backend calls
- **Firebase SDK** - Client-side authentication
- **Fetch API** - HTTP requests to backend
- **Sessions** - Cookies maintain authentication

## 🎓 Learning Resources

### Frontend
- JavaScript: habits stored in LocalStorage, DOM manipulation
- Canvas: 7-day progress graph rendering
- Firebase: Google authentication integration

### Backend
- Express.js: routing, middleware, server management
- CORS: cross-origin resource sharing configuration
- Sessions: cookie-based user authentication

## 📈 Next Steps (Optional)

### To Improve the Application

1. **Add Database**
   - Replace localStorage with MongoDB/PostgreSQL
   - Store habits in backend database
   - Sync across devices

2. **Add Mobile App**
   - Use React Native or Flutter
   - Share same backend API
   - Access habits on phone

3. **Add Cloud Deployment**
   - Deploy backend to Heroku/AWS
   - Deploy frontend to Netlify/Vercel
   - Live production app

4. **Add Features**
   - Habit reminders/notifications
   - Social sharing/leaderboards
   - Export data as CSV/PDF
   - Dark/light theme toggle

## ✨ Summary

**Your HabitSync app is ready to use!**

1. ✅ Backend is organized and running
2. ✅ Frontend is organized and ready to serve
3. ✅ Authentication is fully functional
4. ✅ All code is commented and organized

**To get started:**
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Serve frontend (choose one)
cd frontend && python -m http.server 5500

# Browser: Open http://127.0.0.1:5500
```

Enjoy tracking your habits! 🎯

---

**Need help?** Check the main [README.md](../README.md) for detailed documentation.

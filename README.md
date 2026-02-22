# HabitSync - Habit Tracking Application

A modern habit tracker built with vanilla HTML, CSS, JavaScript, Firebase authentication, and Express.js backend.

## ✨ Features

### Frontend
- **Multi-page Application**: Landing page, Dashboard, Stats page
- **Habit Management**: Create, edit, delete habits with frequency selection
- **Daily Check-offs**: Track completion with automatic streak calculation
- **Progress Visualization**: Canvas-based 7-day progress graph, statistics dashboard
- **Dark Mode UI**: Glassmorphism design with frosted glass effects
- **Firebase Authentication**: Google Sign-In with session persistence

### Backend
- **Express.js REST API**: Full habit management endpoints
- **Session Management**: User sessions with 24-hour persistence
- **CORS Support**: Configured for local development
- **Health Monitoring**: API health checks

## 📁 Project Structure

```
HabitSync/
├── frontend/                    # Frontend files (vanilla HTML/CSS/JS)
│   ├── index.html              # Landing page
│   ├── dashboard.html          # Habit management page
│   ├── stats.html              # Statistics & progress page
│   ├── styles.css              # Main stylesheet
│   ├── auth.js                 # Firebase authentication
│   ├── api-client.js           # Backend API communication
│   ├── dashboard.js            # Dashboard logic
│   └── stats.js                # Statistics & graph rendering
│
├── backend/                     # Backend API server
│   ├── server.js               # Express.js server with routes
│   ├── package.json            # Node dependencies
│   ├── .env                    # Environment variables
│   └── node_modules/           # Installed dependencies
│
└── package.json                # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm (v6+)
- Modern web browser

### Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Expected output:
   ```
   ╔════════════════════════════════════════╗
   ║     HabitSync Backend Server           ║
   ║     Running on port 5000               ║
   ║     Environment: development           ║
   ╚════════════════════════════════════════╝
   
   ✓ CORS enabled for localhost
   ✓ Firebase configured
   ✓ Session management active
   ```

### Frontend Setup

1. **Open frontend folder** in VS Code or your editor

2. **Serve the frontend** using one of these methods:
   - **VS Code Live Server**: Right-click `index.html` → "Open with Live Server"
   - **Python**: `python -m http.server 5500` (in frontend folder)
   - **Node.js**: `npx http-server -p 5500`

3. **Access the app:**
   - Navigate to `http://127.0.0.1:5500`

## 🔐 Authentication Flow

1. User clicks "Sign in with Google" on landing page
2. Firebase popup authenticates with Google
3. Auth.js sends userId and email to backend via APIClient.loginUser()
4. Backend creates a session for the user
5. User is redirected to dashboard
6. Session persists across browser restarts (LOCAL persistence)
7. On logout, both backend session and Firebase auth are cleared

## 📡 API Endpoints

### Authentication
- `GET /api/health` - Server health check
- `GET /api/auth/verify` - Verify user session
- `POST /api/auth/login` - Create session after Firebase auth
- `POST /api/auth/logout` - Destroy session

### Habits (User-specific)
- `GET /api/habits/:userId` - Get user's habits
- `POST /api/habits/:userId` - Create new habit
- `PUT /api/habits/:userId/:habitId` - Update habit
- `DELETE /api/habits/:userId/:habitId` - Delete habit

### Statistics
- `GET /api/stats/:userId` - Get user statistics

## 🔧 Configuration

### Backend Environment Variables (.env)
Located in `backend/.env`:

```env
PORT=5000                                           # Server port
NODE_ENV=development                               # Environment
SESSION_SECRET=habitsync-secret-key-change-in-production  # Session secret
FIREBASE_PROJECT_ID=habitsync-455d3
FIREBASE_API_KEY=AIzaSyBVizMs2008bavqmB5cQVeYiGOZFuFewDU
FIREBASE_AUTH_DOMAIN=habitsync-455d3.firebaseapp.com
FRONTEND_URL_LOCAL=http://127.0.0.1:5500
FRONTEND_URL_DEV=http://localhost:3000
```

### Firebase Configuration
Already configured in `frontend/auth.js` with project ID: `habitsync-455d3`

## 🎨 Design System

### Colors
- **Background**: `#0a0e27` (Dark navy)
- **Glass**: `rgba(19, 24, 41, 0.7)` (70% opacity with blur)
- **Primary Accent**: `#00d4ff` (Cyan)
- **Success**: `#00ff88` (Green)
- **Danger**: `#ff4444` (Red)

### Design Pattern
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Dark Mode**: Professional productivity aesthetic
- **Responsive**: Optimized for desktop browsers

## 🔗 Frontend-Backend Communication

All API calls are handled by `frontend/api-client.js`:

```javascript
// Example: Backend login after Firebase auth
await APIClient.loginUser(user.uid, user.email);

// Example: Verify session
const session = await APIClient.verifySession();

// Example: Logout
await APIClient.logoutUser();
```

## 📊 Data Storage

### Frontend (LocalStorage)
- Habits stored locally in browser
- Key: `habitsync_habits_{userId}`
- Survives browser restart

### Backend (Sessions)
- User sessions stored in express-session
- 24-hour cookie expiration
- Automatic cleanup on logout

## 🐛 Troubleshooting

### Backend won't start
```bash
# Verify Node.js installation
node -v

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Frontend can't connect to backend
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Verify CORS origins in `backend/server.js`

### Firebase authentication fails
- Check Firebase config in `frontend/auth.js`
- Verify domain is authorized in Firebase Console
- Check browser console for detailed error messages

### Session not persisting
- Ensure backend is running (sessions in memory)
- Check that cookies are enabled
- Verify `SESSION_SECRET` is set in `.env`

## 🚢 Deployment Considerations

Before deploying to production:

1. **Update CORS origins** in `backend/server.js`
2. **Change SESSION_SECRET** to a secure random value
3. **Set NODE_ENV=production**
4. **Use HTTPS** and set `secure: true` in session cookie
5. **Implement database** to replace in-memory sessions
6. **Use production Firebase credentials**
7. **Set up environment variables** on hosting platform

## 💾 Data Structure

### Habit Object
```javascript
{
  id: "habit_1708345600000_abc123def",
  name: "Morning Exercise",
  frequency: "Daily",
  streak: 5,
  completedDays: {
    "2026-02-19": true,
    "2026-02-18": true
  },
  createdAt: "2026-02-15T10:30:00.000Z"
}
```

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Verify Session
```bash
curl http://localhost:5000/api/auth/verify
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","email":"user@example.com"}'
```

## 📚 Technology Stack

### Frontend
- HTML5, CSS3, ES6+ JavaScript
- Firebase Client SDK
- Canvas API
- LocalStorage API

### Backend
- Node.js, Express.js
- CORS middleware
- express-session
- dotenv

## 📝 Development Notes

### File Locations Are Important
- Frontend files must be in `/frontend` folder
- Backend files must be in `/backend` folder
- API client is in `/frontend/api-client.js`

### Key JavaScript Managers
- **LocalStorageManager**: Handles habit data persistence
- **DashboardManager**: Manages habit UI and forms
- **StatsManager**: Calculates statistics
- **CanvasGraphManager**: Renders progress graph
- **APIClient**: Backend API communication

## 🤝 Contributing

Maintain folder structure and test both frontend and backend when making changes.

## 📄 License

ISC

---

**Last Updated**: February 23, 2026

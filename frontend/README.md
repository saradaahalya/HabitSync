# HabitSync Frontend (React + Vite)

Modern React-based frontend for HabitSync habit tracking application with Tailwind CSS styling.

## Tech Stack
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Firebase** - Authentication
- **Axios** - HTTP client

## Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
The `.env` file is pre-configured to connect to the backend running on `http://localhost:5000`.

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure
```
src/
├── components/        # Reusable React components
│   ├── Button.jsx
│   ├── Header.jsx
│   ├── HabitList.jsx
│   ├── AddHabitForm.jsx
│   ├── FeatureCard.jsx
│   └── StatCard.jsx
├── pages/            # Page components
│   ├── LandingPage.jsx
│   ├── Dashboard.jsx
│   └── Stats.jsx
├── lib/              # Utilities
│   ├── firebase.js   # Firebase setup
│   └── api.js        # API client
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Features
- ✅ Google OAuth authentication
- ✅ Create, track, and manage habits
- ✅ Daily check-ins with streaks
- ✅ Progress statistics
- ✅ Beautiful glassmorphism UI
- ✅ Responsive design
- ✅ Dark mode theme

## Building for Production
```bash
npm run build
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Notes
- Make sure the backend is running on port 5000
- Firebase credentials should be configured in `src/lib/firebase.js`

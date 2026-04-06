import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'

// Declare Firebase globally to use from global scope
let currentUser = null

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for Firebase to be available globally
    const checkFirebase = setInterval(() => {
      if (typeof firebase !== 'undefined') {
        clearInterval(checkFirebase)
        initAuth()
      }
    }, 100)

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkFirebase), 5000)
  }, [])

  const initAuth = () => {
    try {
      console.log('App: Initializing Firebase auth...')
      
      if (firebase.apps.length === 0) {
        const firebaseConfig = {
          apiKey: "AIzaSyBVizMs2008bavqmB5cQVeYiGOZFuFewDU",
          authDomain: "habitsync-455d3.firebaseapp.com",
          projectId: "habitsync-455d3",
          storageBucket: "habitsync-455d3.firebasestorage.app",
          messagingSenderId: "861608812567",
          appId: "1:861608812567:web:628f74d182db113b4abc52"
        }
        firebase.initializeApp(firebaseConfig)
        console.log('Firebase initialized')
      }

      // Subscribe to auth state changes
      firebase.auth().onAuthStateChanged(async (firebaseUser) => {
        console.log('Auth state changed:', firebaseUser?.uid || 'null')
        if (firebaseUser) {
          // Ensure backend session exists on every app load.
          try {
            await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName
              })
            })
          } catch (err) {
            console.warn('Backend session sync failed:', err?.message || err)
          }
        }
        currentUser = firebaseUser
        setUser(firebaseUser)
        setLoading(false)
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading HabitSync...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />} />
        <Route path="/stats" element={user ? <Stats user={user} /> : <Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

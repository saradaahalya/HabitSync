import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      if (typeof firebase === 'undefined') {
        throw new Error('Firebase not initialized')
      }

      console.log('Starting Google sign-in...')
      const provider = new firebase.auth.GoogleAuthProvider()
      const result = await firebase.auth().signInWithPopup(provider)
      const user = result.user

      console.log('Google sign-in successful:', user.uid)

      // Create session on backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error('Backend session failed: ' + response.status)
      }

      console.log('Backend session created')
      setLoading(false)
      navigate('/dashboard')
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error.message || 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
            HabitSync
          </h1>
          <p className="text-xl text-gray-300">Build habits. Track progress. Stay consistent.</p>
        </div>

        {/* Main Card */}
        <div className="glass-card p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Welcome to HabitSync</h2>
            <p className="text-gray-300 text-lg">
              Track your daily habits, build streaks, and visualize your progress. Stay consistent and achieve your goals.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="glass-card p-4 hover:bg-[rgba(19,24,41,0.8)] transition-all">
              <div className="text-3xl mb-2">✓</div>
              <h3 className="font-semibold mb-1 text-primary">Create & Manage</h3>
              <p className="text-sm text-gray-400">Build and track habits</p>
            </div>
            <div className="glass-card p-4 hover:bg-[rgba(19,24,41,0.8)] transition-all">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1 text-primary">Track Progress</h3>
              <p className="text-sm text-gray-400">Daily check-offs and streaks</p>
            </div>
            <div className="glass-card p-4 hover:bg-[rgba(19,24,41,0.8)] transition-all">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="font-semibold mb-1 text-primary">Build Streaks</h3>
              <p className="text-sm text-gray-400">Stay consistent daily</p>
            </div>
            <div className="glass-card p-4 hover:bg-[rgba(19,24,41,0.8)] transition-all">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold mb-1 text-primary">Visualize</h3>
              <p className="text-sm text-gray-400">See your progress</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 cursor-pointer w-full md:w-auto"
            >
              {loading ? 'Signing in...' : '🔐 Sign in with Google'}
            </button>
            <p className="text-sm text-gray-400">
              New here? Sign in to create your account and start tracking habits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>Build better habits. One day at a time. 🚀</p>
        </div>
      </div>
    </div>
  )
}

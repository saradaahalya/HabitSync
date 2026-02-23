import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../lib/firebase'
import Button from '../components/Button'
import FeatureCard from '../components/FeatureCard'

export default function LandingPage() {
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle()
      if (user) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Sign in failed:', error)
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
            <FeatureCard 
              icon="✓" 
              title="Create & Manage" 
              description="Build and track habits"
            />
            <FeatureCard 
              icon="📊" 
              title="Track Progress" 
              description="Daily check-offs and streaks"
            />
            <FeatureCard 
              icon="🔥" 
              title="Build Streaks" 
              description="Stay consistent daily"
            />
            <FeatureCard 
              icon="📈" 
              title="Visualize" 
              description="See your progress"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4">
            <Button 
              onClick={handleGoogleSignIn}
              variant="primary"
              size="lg"
              className="w-full md:w-auto"
            >
              🔐 Sign in with Google
            </Button>
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

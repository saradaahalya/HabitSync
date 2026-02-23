import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logOut } from '../lib/firebase'
import * as api from '../lib/api'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import Button from '../components/Button'

export default function Stats({ user }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatsData()
  }, [])

  const fetchStatsData = async () => {
    try {
      setLoading(true)
      const [statsResponse, habitsResponse] = await Promise.all([
        api.getStats(),
        api.getHabits()
      ])
      
      setStats(statsResponse.data)
      setHabits(habitsResponse.data || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.logoutUser().catch(e => console.log('Backend logout error (non-blocking):', e))
      await logOut()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Your Progress</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading stats...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                  label="Total Habits" 
                  value={stats.totalHabits || 0}
                />
                <StatCard 
                  label="Active Streaks" 
                  value={stats.activeStreaks || 0}
                />
                <StatCard 
                  label="Check-ins Today" 
                  value={stats.checkinsToday || 0}
                />
                <StatCard 
                  label="Consistency Rate" 
                  value={`${stats.consistencyRate || 0}%`}
                />
              </div>
            )}

            {/* Habits Preview */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Your Habits Overview</h3>
              {habits.length === 0 ? (
                <p className="text-gray-400">No habits to display. Create your first habit in the dashboard!</p>
              ) : (
                <div className="space-y-3">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-4 bg-dark-tertiary rounded-lg hover:bg-dark-tertiary/80 transition">
                      <div>
                        <h4 className="font-semibold">{habit.name}</h4>
                        <p className="text-sm text-gray-400">{habit.frequency} • Streak: {habit.streak || 0} days</p>
                      </div>
                      <div className="text-2xl font-bold text-primary">{habit.completionRate || 0}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

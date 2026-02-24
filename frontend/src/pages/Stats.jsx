import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Stats({ user }) {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(false)
  const [chartType, setChartType] = useState('bar') // 'bar', 'line', 'pie', 'doughnut'
  const STORAGE_KEY = `habits_${user?.uid || 'unknown'}`

  useEffect(() => {
    console.log('Stats: Component mounted for user:', user?.uid)
    loadHabits()
  }, [user, STORAGE_KEY])

  const loadHabits = async () => {
    try {
      setLoading(true)
      
      // Try to fetch from backend first
      try {
        console.log('Stats: Fetching from backend...')
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Stats: Got habits from backend:', data.habits)
          if (data.habits && data.habits.length > 0) {
            setHabits(data.habits)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.habits))
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.log('Stats: Backend error (not critical):', err.message)
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        console.log('Stats: Using stored habits from localStorage')
        setHabits(JSON.parse(stored))
      } else {
        console.log('Stats: No stored habits')
        setHabits([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      }).catch(e => console.log('Backend logout error (non-critical):', e))

      await firebase.auth().signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/')
    }
  }

  // Calculate stats from habits
  const calculateStats = () => {
    if (!habits || habits.length === 0) {
      return {
        totalHabits: 0,
        averageStreak: 0,
        longestStreak: 0,
        completionRate: 0
      }
    }

    const totalHabits = habits.length
    const streaks = habits.map(h => h.streak || 0)
    const averageStreak = streaks.length > 0 ? Math.floor(streaks.reduce((a, b) => a + b) / streaks.length) : 0
    const longestStreak = streaks.length > 0 ? Math.max(...streaks) : 0
    const completionRate = streaks.length > 0 ? Math.floor((streaks.filter(s => s > 0).length / streaks.length) * 100) : 0

    return {
      totalHabits,
      averageStreak,
      longestStreak,
      completionRate
    }
  }

  const stats = calculateStats()

  // Chart data generators
  const generateBarChartData = () => {
    return {
      labels: habits.map(h => h.name),
      datasets: [
        {
          label: 'Streak (days)',
          data: habits.map(h => h.streak || 0),
          backgroundColor: 'rgba(0, 255, 204, 0.8)',
          borderColor: 'rgba(0, 255, 204, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(0, 255, 204, 1)',
        }
      ]
    }
  }

  const generateLineChartData = () => {
    return {
      labels: habits.length > 0 ? Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`) : ['Day 1'],
      datasets: habits.map((habit, idx) => ({
        label: habit.name,
        data: Array.from({ length: 7 }, (_, i) => Math.max(0, (habit.streak || 0) - (6 - i))),
        borderColor: `hsl(${idx * 60}, 100%, 50%)`,
        backgroundColor: `hsla(${idx * 60}, 100%, 50%, 0.1)`,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }))
    }
  }

  const generatePieChartData = () => {
    const active = habits.filter(h => (h.streak || 0) > 0).length
    const inactive = habits.length - active
    return {
      labels: ['Active', 'Inactive'],
      datasets: [
        {
          data: [active, inactive],
          backgroundColor: [
            'rgba(0, 255, 204, 0.8)',
            'rgba(255, 0, 127, 0.3)',
          ],
          borderColor: [
            'rgba(0, 255, 204, 1)',
            'rgba(255, 0, 127, 1)',
          ],
          borderWidth: 2,
        }
      ]
    }
  }

  const generateDoughnutChartData = () => {
    const frequencies = {}
    habits.forEach(h => {
      frequencies[h.frequency] = (frequencies[h.frequency] || 0) + 1
    })
    
    const colors = {
      daily: 'rgba(0, 255, 204, 0.8)',
      weekly: 'rgba(100, 200, 255, 0.8)',
      monthly: 'rgba(255, 200, 100, 0.8)',
    }

    return {
      labels: Object.keys(frequencies),
      datasets: [
        {
          data: Object.values(frequencies),
          backgroundColor: Object.keys(frequencies).map(freq => colors[freq] || 'rgba(150, 150, 150, 0.8)'),
          borderColor: 'rgba(255, 255, 255, 1)',
          borderWidth: 2,
        }
      ]
    }
  }

  const getChartData = () => {
    switch (chartType) {
      case 'line':
        return generateLineChartData()
      case 'pie':
        return generatePieChartData()
      case 'doughnut':
        return generateDoughnutChartData()
      case 'bar':
      default:
        return generateBarChartData()
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12 },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 1)',
      }
    },
    scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              HabitSync
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link to="/dashboard" className="pb-2 text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <Link to="/stats" className="pb-2 text-primary border-b-2 border-primary">
                Stats
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-dark-tertiary text-primary border border-primary hover:bg-dark-secondary transition rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Your Progress</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading stats...</p>
          </div>
        ) : (
          <>
            {/* Chart Section */}
            {habits.length > 0 && (
              <div className="glass-card p-6 mb-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">Habit Tracking Visualization</h3>
                  
                  {/* Chart Type Toggle */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        chartType === 'bar'
                          ? 'bg-gradient-to-r from-primary to-secondary text-black'
                          : 'bg-dark-tertiary text-gray-300 hover:text-white'
                      }`}
                    >
                      📊 Bar
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        chartType === 'line'
                          ? 'bg-gradient-to-r from-primary to-secondary text-black'
                          : 'bg-dark-tertiary text-gray-300 hover:text-white'
                      }`}
                    >
                      📈 Line
                    </button>
                    <button
                      onClick={() => setChartType('pie')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        chartType === 'pie'
                          ? 'bg-gradient-to-r from-primary to-secondary text-black'
                          : 'bg-dark-tertiary text-gray-300 hover:text-white'
                      }`}
                    >
                      🥧 Pie
                    </button>
                    <button
                      onClick={() => setChartType('doughnut')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        chartType === 'doughnut'
                          ? 'bg-gradient-to-r from-primary to-secondary text-black'
                          : 'bg-dark-tertiary text-gray-300 hover:text-white'
                      }`}
                    >
                      🍩 Doughnut
                    </button>
                  </div>

                  {/* Chart Container */}
                  <div className="bg-dark-tertiary rounded-lg p-6 h-96 flex items-center justify-center">
                    {habits.length > 0 ? (
                      <>
                        {chartType === 'bar' && <Bar data={getChartData()} options={chartOptions} />}
                        {chartType === 'line' && <Line data={getChartData()} options={chartOptions} />}
                        {chartType === 'pie' && <Pie data={getChartData()} options={chartOptions} />}
                        {chartType === 'doughnut' && <Doughnut data={getChartData()} options={chartOptions} />}
                      </>
                    ) : (
                      <p className="text-gray-400">Create habits to see visualization</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-6 text-center hover:bg-[rgba(19,24,41,0.8)] transition">
                <p className="text-gray-400 text-sm mb-2">Total Habits</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stats.totalHabits}
                </p>
              </div>
              <div className="glass-card p-6 text-center hover:bg-[rgba(19,24,41,0.8)] transition">
                <p className="text-gray-400 text-sm mb-2">Longest Streak</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stats.longestStreak} 🔥
                </p>
              </div>
              <div className="glass-card p-6 text-center hover:bg-[rgba(19,24,41,0.8)] transition">
                <p className="text-gray-400 text-sm mb-2">Average Streak</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stats.averageStreak}
                </p>
              </div>
              <div className="glass-card p-6 text-center hover:bg-[rgba(19,24,41,0.8)] transition">
                <p className="text-gray-400 text-sm mb-2">Active Habits</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stats.completionRate}%
                </p>
              </div>
            </div>

            {/* Habits Overview */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Your Habits Overview</h3>
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No habits yet. Create your first habit in the dashboard!</p>
                  <Link to="/dashboard" className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg">
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-4 bg-dark-tertiary rounded-lg hover:bg-dark-tertiary/80 transition">
                      <div className="flex-1">
                        <h4 className="font-semibold">{habit.name}</h4>
                        <p className="text-sm text-gray-400">{habit.frequency} • Last check-in: {habit.lastCheckIn ? new Date(habit.lastCheckIn).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{habit.streak || 0} 🔥</div>
                        <p className="text-xs text-gray-400">streak</p>
                      </div>
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

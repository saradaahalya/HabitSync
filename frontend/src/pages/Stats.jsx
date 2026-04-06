import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bar, Line } from 'react-chartjs-2'
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
  Legend
)

export default function Stats({ user }) {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(false)
  const STORAGE_KEY = `habits_${user?.uid || 'unknown'}`
  const normalizeHabit = (habit) => ({
    ...habit,
    name: habit.name || habit.title || '',
    description: habit.description || '',
    frequency: habit.frequency || 'daily',
    logs: Array.isArray(habit.logs) ? habit.logs : []
  })
  const getHabitStreakValue = (habit) => {
    return habit.streak ?? habit.logs?.length ?? 0
  }

  const getLast7Days = () => {
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d)
    }
    return days
  }

  const toDayKey = (date) => {
    const d = new Date(date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const getCurrentWeekDays = () => {
    const today = new Date()
    const day = today.getDay() // 0=Sun, 1=Mon
    const diffToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d)
    }
    return days
  }

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
          const normalizedHabits = (data.habits || []).map(normalizeHabit)
          console.log('Stats: Got habits from backend:', normalizedHabits)
          setHabits(normalizedHabits)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedHabits))
          setLoading(false)
          return
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
    const streaks = habits.map(h => getHabitStreakValue(h))
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

  const getWeeklyDailyHoursData = () => {
    const days = getCurrentWeekDays()
    const totalsByDay = {}
    days.forEach((d) => {
      totalsByDay[toDayKey(d)] = 0
    })

    habits.forEach((habit) => {
      ;(habit.logs || []).forEach((log) => {
        const key = toDayKey(log.date)
        if (key in totalsByDay && log.completed) {
          totalsByDay[key] += (log.durationMinutes || 0) / 60
        }
      })
    })

    return {
      labels: days.map((d) => d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' })),
      datasets: [
        {
          label: 'Hours',
          data: days.map((d) => Number(totalsByDay[toDayKey(d)].toFixed(2))),
          borderColor: 'rgba(0, 255, 204, 1)',
          backgroundColor: 'rgba(0, 255, 204, 0.2)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
        }
      ]
    }
  }

  const getHabitWiseWeeklyHoursData = () => {
    const dayKeys = new Set(getCurrentWeekDays().map(toDayKey))
    return {
      labels: habits.map((h) => h.name),
      datasets: [
        {
          label: 'Hours',
          data: habits.map((habit) => {
            const weeklyHours = (habit.logs || []).reduce((sum, log) => {
              if (log.completed && dayKeys.has(toDayKey(log.date))) {
                return sum + (log.durationMinutes || 0) / 60
              }
              return sum
            }, 0)
            return Number(weeklyHours.toFixed(2))
          }),
          backgroundColor: 'rgba(100, 200, 255, 0.8)',
          borderColor: 'rgba(100, 200, 255, 1)',
          borderWidth: 2,
          borderRadius: 8,
        }
      ]
    }
  }

  const getWeeklyOverviewForHabit = (habit) => {
    const dayKeys = new Set(getCurrentWeekDays().map(toDayKey))
    const weeklyLogs = (habit.logs || []).filter((log) => log.completed && dayKeys.has(toDayKey(log.date)))
    const weeklyHours = weeklyLogs.reduce((sum, log) => sum + (log.durationMinutes || 0) / 60, 0)
    const latest = weeklyLogs.length > 0
      ? weeklyLogs.map((l) => new Date(l.date)).sort((a, b) => b - a)[0]
      : null
    return {
      weeklyCheckins: weeklyLogs.length,
      weeklyHours: Number(weeklyHours.toFixed(2)),
      latest
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
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: {
          display: true,
          text: 'Hours',
          color: 'rgba(255, 255, 255, 0.8)'
        }
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
                <h3 className="text-xl font-bold mb-4">Daily Hours (This Week: Mon-Sun)</h3>
                <div className="bg-dark-tertiary rounded-lg p-6 h-96 flex items-center justify-center mb-8">
                  <Line data={getWeeklyDailyHoursData()} options={chartOptions} />
                </div>
                <h3 className="text-xl font-bold mb-4">Habit-wise Hours (This Week)</h3>
                <div className="bg-dark-tertiary rounded-lg p-6 h-96 flex items-center justify-center">
                  <Bar data={getHabitWiseWeeklyHoursData()} options={chartOptions} />
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
                        <p className="text-sm text-gray-400">
                          {habit.frequency} • Last check-in:{' '}
                          {getWeeklyOverviewForHabit(habit).latest ? getWeeklyOverviewForHabit(habit).latest.toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{getWeeklyOverviewForHabit(habit).weeklyHours}h</div>
                        <p className="text-xs text-gray-400">{getWeeklyOverviewForHabit(habit).weeklyCheckins} check-ins this week</p>
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

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Notes({ user }) {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('byHabit') // 'byHabit' | 'byDay'
  const STORAGE_KEY = `habits_${user?.uid || 'unknown'}`

  const normalizeHabit = (habit) => ({
    ...habit,
    name: habit.name || habit.title || '',
    description: habit.description || '',
    frequency: habit.frequency || 'daily',
    logs: Array.isArray(habit.logs) ? habit.logs : []
  })

  useEffect(() => {
    loadHabits()
  }, [user, STORAGE_KEY])

  const loadHabits = async () => {
    try {
      setLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const data = await response.json()
          const normalized = (data.habits || []).map(normalizeHabit)
          setHabits(normalized)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
          setLoading(false)
          return
        }
      } catch (err) {
        // fallback to localStorage
      }
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHabits(JSON.parse(stored))
      else setHabits([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' })
      await firebase.auth().signOut()
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
      navigate('/')
    }
  }

  const renderLogsWithNotes = (habit) => {
    if (!habit.logs || habit.logs.length === 0) {
      return <div className="text-sm text-gray-400">No check-ins yet.</div>
    }
    const sorted = [...habit.logs].sort((a, b) => new Date(b.date) - new Date(a.date))
    return (
      <div className="space-y-3">
        {sorted.map((log, idx) => (
          <div key={idx} className="p-3 bg-dark-tertiary rounded-lg border border-[rgba(255,255,255,0.03)]">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">{new Date(log.date).toLocaleString()}</div>
                <div className="font-medium">{log.completed ? 'Completed' : 'Missed'}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{log.notes && log.notes.length > 0 ? log.notes : <span className="text-gray-400">— No notes —</span>}</div>
          </div>
        ))}
      </div>
    )
  }

  const groupLogsByDay = () => {
    const dayMap = {}
    habits.forEach((habit) => {
      ;(habit.logs || []).forEach((log) => {
        const d = new Date(log.date)
        const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
        if (!dayMap[key]) dayMap[key] = []
        dayMap[key].push({
          habitId: habit.id,
          habitName: habit.name,
          date: log.date,
          notes: log.notes || '',
          durationMinutes: log.durationMinutes || 0,
          completed: !!log.completed
        })
      })
    })
    // return sorted array of { dateKey, entries[] }
    return Object.keys(dayMap).sort((a, b) => (a < b ? 1 : -1)).map((k) => ({ dateKey: k, entries: dayMap[k].sort((a, b) => new Date(b.date) - new Date(a.date)) }))
  }

  return (
    <div className="min-h-screen bg-dark">
      <header className="bg-dark-secondary border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">HabitSync</Link>
            <nav className="hidden md:flex gap-6">
              <Link to="/dashboard" className="pb-2 text-gray-400 hover:text-white transition">Dashboard</Link>
              <Link to="/stats" className="pb-2 text-gray-400 hover:text-white transition">Stats</Link>
              <div className="pb-2 text-primary border-b-2 border-primary cursor-default">Notes</div>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="px-4 py-2 bg-dark-tertiary text-primary border border-primary hover:bg-dark-secondary transition rounded-lg">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Notes</h2>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Notes</h2>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('byHabit')} className={`px-3 py-2 rounded ${viewMode === 'byHabit' ? 'bg-primary text-black' : 'bg-dark-tertiary text-gray-300'}`}>By Habit</button>
            <button onClick={() => setViewMode('byDay')} className={`px-3 py-2 rounded ${viewMode === 'byDay' ? 'bg-primary text-black' : 'bg-dark-tertiary text-gray-300'}`}>By Day</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading notes...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {habits.length === 0 && (
              <div className="glass-card p-6 text-center">
                <p className="text-gray-400">No habits yet. Create a habit on the Dashboard to start adding notes.</p>
                <Link to="/dashboard" className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg">Go to Dashboard</Link>
              </div>
            )}
            {viewMode === 'byHabit' && habits.map((habit) => (
              <div key={habit.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{habit.name}</h3>
                    <p className="text-sm text-gray-400">{habit.description}</p>
                  </div>
                </div>
                {renderLogsWithNotes(habit)}
              </div>
            ))}

            {viewMode === 'byDay' && (
              <div className="space-y-4">
                {groupLogsByDay().length === 0 && (
                  <div className="glass-card p-6 text-center text-gray-400">No check-ins yet.</div>
                )}
                {groupLogsByDay().map((day) => (
                  <div key={day.dateKey} className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-3">{new Date(day.dateKey).toLocaleDateString()}</h3>
                    <div className="space-y-3">
                      {day.entries.map((e, i) => (
                        <div key={i} className="p-3 bg-dark-tertiary rounded-lg border border-[rgba(255,255,255,0.03)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm text-gray-400">{new Date(e.date).toLocaleTimeString()}</div>
                              <div className="font-medium">{e.habitName}</div>
                            </div>
                            <div className="text-sm text-gray-400">{Math.round((e.durationMinutes||0))} min</div>
                          </div>
                          <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{e.notes && e.notes.length > 0 ? e.notes : <span className="text-gray-400">— No notes —</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

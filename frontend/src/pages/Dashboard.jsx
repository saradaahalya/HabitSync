import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', frequency: 'daily' })
  const [creating, setCreating] = useState(false)
  const [editingHabitId, setEditingHabitId] = useState(null)
  const [editFormData, setEditFormData] = useState({ name: '', description: '', frequency: 'daily' })
  const [saving, setSaving] = useState(false)
  
  // Storage key for this user
  const STORAGE_KEY = `habits_${user?.uid || 'unknown'}`

  // Load habits from localStorage on mount
  useEffect(() => {
    console.log('Dashboard mounted for user:', user?.uid)
    loadHabits()
  }, [user, STORAGE_KEY])

  const loadHabits = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to fetch from backend first
      try {
        console.log('Fetching from backend...')
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Got habits from backend:', data.habits)
          if (data.habits && data.habits.length > 0) {
            setHabits(data.habits)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.habits))
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.log('Backend error (not critical):', err.message)
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        console.log('Using stored habits from localStorage')
        setHabits(JSON.parse(stored))
      } else {
        console.log('No stored habits')
        setHabits([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddHabit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Habit name is required')
      return
    }

    try {
      setCreating(true)
      setError(null)
      console.log('Creating habit:', formData)
      
      // Create new habit object
      const newHabit = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description || '',
        frequency: formData.frequency,
        streak: 0,
        createdAt: new Date().toISOString(),
        lastCheckIn: null
      }

      // Try to save to backend
      let backendSuccess = false
      try {
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Backend created habit:', data.habit)
          backendSuccess = true
        } else {
          console.warn('Backend creation failed:', response.status)
        }
      } catch (err) {
        console.warn('Backend unavailable, using localStorage:', err.message)
      }

      // Always save to localStorage as backup
      const updated = [...habits, newHabit]
      setHabits(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
      // Clear form
      setFormData({ name: '', description: '', frequency: 'daily' })
      setShowAddForm(false)
      
      console.log('Habit created successfully (localStorage):', newHabit)
    } catch (err) {
      console.error('Error creating habit:', err)
      setError(err.message || 'Failed to create habit')
    } finally {
      setCreating(false)
    }
  }

  const handleCheckIn = async (habitId) => {
    try {
      setError(null)
      
      // Update locally first
      const updated = habits.map(h => {
        if (h.id === habitId) {
          return { ...h, streak: (h.streak || 0) + 1, lastCheckIn: new Date().toISOString() }
        }
        return h
      })
      setHabits(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      // Try to sync with backend
      try {
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}/${habitId}/checkin`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          console.warn('Backend check-in failed:', response.status)
        }
      } catch (err) {
        console.warn('Backend unavailable for check-in:', err.message)
      }
    } catch (err) {
      console.error('Check-in error:', err)
      setError(err.message)
    }
  }

  const handleDeleteHabit = async (habitId) => {
    try {
      setError(null)
      
      // Update locally first
      const updated = habits.filter(h => h.id !== habitId)
      setHabits(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      // Try to sync with backend
      try {
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}/${habitId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          console.warn('Backend delete failed:', response.status)
        }
      } catch (err) {
        console.warn('Backend unavailable for delete:', err.message)
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message)
    }
  }

  const handleEditHabit = (habit) => {
    setEditingHabitId(habit.id)
    setEditFormData({
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    
    if (!editFormData.name.trim()) {
      setError('Habit name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Update locally
      const updated = habits.map(h => {
        if (h.id === editingHabitId) {
          return {
            ...h,
            name: editFormData.name.trim(),
            description: editFormData.description,
            frequency: editFormData.frequency
          }
        }
        return h
      })
      setHabits(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      // Try to sync with backend
      try {
        const response = await fetch(`http://localhost:5000/api/habits/${user.uid}/${editingHabitId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        })

        if (!response.ok) {
          console.warn('Backend update failed:', response.status)
        }
      } catch (err) {
        console.warn('Backend unavailable for update:', err.message)
      }

      setEditingHabitId(null)
      setEditFormData({ name: '', description: '', frequency: 'daily' })
      console.log('Habit updated successfully')
    } catch (err) {
      console.error('Error saving habit:', err)
      setError(err.message || 'Failed to save habit')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingHabitId(null)
    setEditFormData({ name: '', description: '', frequency: 'daily' })
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

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              HabitSync
            </div>
            <nav className="hidden md:flex gap-6">
              <div className="pb-2 text-primary border-b-2 border-primary cursor-default">
                Dashboard
              </div>
              <Link to="/stats" className="pb-2 text-gray-400 hover:text-white transition">
                Stats
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-400">Welcome</p>
              <p className="font-semibold">{user?.displayName || user?.email || 'User'}</p>
            </div>
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
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Add Habit Section */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Habits</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:shadow-lg transition"
          >
            {showAddForm ? '✕ Cancel' : '+ New Habit'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 glass-card p-6 space-y-4">
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Habit Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Jog"
                  className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Why is this important?"
                  className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating || !formData.name.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Habit'}
              </button>
            </form>
          </div>
        )}

        {/* Edit Habit Modal */}
        {editingHabitId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-md">
              <h3 className="text-2xl font-bold mb-4">Edit Habit</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Habit Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g., Morning Jog"
                    className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Why is this important?"
                    className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Frequency</label>
                  <select
                    value={editFormData.frequency}
                    onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                    className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || !editFormData.name.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-6 py-3 bg-dark-tertiary text-gray-300 border border-gray-600 font-semibold rounded-lg hover:bg-dark-secondary transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Habits List */}
        {habits.length === 0 && loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your habits...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <p className="text-gray-400 text-lg mb-4">No habits yet. Create your first habit to get started!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg"
            >
              Create First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <div key={habit.id} className="glass-card p-6 hover:bg-[rgba(19,24,41,0.8)] transition">
                <h3 className="text-xl font-bold mb-2">{habit.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{habit.description}</p>
                
                <div className="bg-dark-tertiary rounded-lg p-3 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frequency:</span>
                    <span className="text-primary font-semibold">{habit.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Streak:</span>
                    <span className="text-green-400 font-bold">🔥 {habit.streak || 0} days</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheckIn(habit.id)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:shadow-lg transition text-sm"
                  >
                    ✓ Check In
                  </button>
                  <button
                    onClick={() => handleEditHabit(habit)}
                    className="px-4 py-2 bg-blue-600/20 border border-blue-600 text-blue-400 font-semibold rounded-lg hover:bg-blue-600/30 transition text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="px-4 py-2 bg-red-600/20 border border-red-600 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

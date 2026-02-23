import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logOut } from '../lib/firebase'
import * as api from '../lib/api'
import Header from '../components/Header'
import HabitList from '../components/HabitList'
import AddHabitForm from '../components/AddHabitForm'
import Button from '../components/Button'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      setLoading(true)
      const response = await api.getHabits()
      setHabits(response.data || [])
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHabit = async (habitData) => {
    try {
      await api.createHabit(habitData)
      setShowAddForm(false)
      fetchHabits()
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const handleCheckIn = async (habitId) => {
    try {
      await api.checkInHabit(habitId)
      fetchHabits()
    } catch (error) {
      console.error('Error checking in habit:', error)
    }
  }

  const handleDeleteHabit = async (habitId) => {
    try {
      await api.deleteHabit(habitId)
      fetchHabits()
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const handleLogout = async () => {
    try {
      // Call backend logout
      await api.logoutUser().catch(e => console.log('Backend logout error (non-blocking):', e))
      
      // Sign out from Firebase
      await logOut()
      
      // Navigate to landing page
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
        {/* Add Habit Section */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Habits</h2>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            variant="primary"
          >
            {showAddForm ? '✕ Cancel' : '+ New Habit'}
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-8">
            <AddHabitForm onAdd={handleAddHabit} />
          </div>
        )}

        {/* Habits List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading your habits...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <p className="text-gray-400 text-lg mb-4">No habits yet. Create your first habit to get started!</p>
            <Button 
              onClick={() => setShowAddForm(true)}
              variant="primary"
            >
              Create First Habit
            </Button>
          </div>
        ) : (
          <HabitList 
            habits={habits}
            onCheckIn={handleCheckIn}
            onDelete={handleDeleteHabit}
          />
        )}
      </main>
    </div>
  )
}

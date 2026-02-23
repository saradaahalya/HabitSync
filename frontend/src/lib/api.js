import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Habits
export const createHabit = (habitData) => apiClient.post('/habits', habitData)
export const getHabits = () => apiClient.get('/habits')
export const updateHabit = (id, habitData) => apiClient.put(`/habits/${id}`, habitData)
export const deleteHabit = (id) => apiClient.delete(`/habits/${id}`)
export const checkInHabit = (id) => apiClient.post(`/habits/${id}/checkin`)
export const getHabitStats = (id) => apiClient.get(`/habits/${id}/stats`)

// User
export const getUser = () => apiClient.get('/user')
export const updateUser = (userData) => apiClient.put('/user', userData)
export const logoutUser = () => apiClient.post('/logout')

// Stats
export const getStats = () => apiClient.get('/stats')

export default apiClient

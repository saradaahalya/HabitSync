import axios from 'axios'
import { getAuthUser } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to get current user ID
const getUserId = () => {
  const user = getAuthUser()
  if (!user?.uid) {
    throw new Error('User not authenticated - getAuthUser returned: ' + JSON.stringify(user))
  }
  return user.uid
}

// Habits - CRUD operations
export const createHabit = async (habitData) => {
  const userId = getUserId()
  console.log('Creating habit for user:', userId)
  return apiClient.post(`/habits/${userId}`, habitData)
}

export const getHabits = async () => {
  try {
    const userId = getUserId()
    console.log('Fetching habits for user:', userId)
    const response = await apiClient.get(`/habits/${userId}`)
    console.log('Habits API response:', response.data)
    return response
  } catch (err) {
    console.error('API Error in getHabits:', err)
    throw err
  }
}

export const updateHabit = async (id, habitData) => {
  const userId = getUserId()
  return apiClient.put(`/habits/${userId}/${id}`, habitData)
}

export const deleteHabit = async (id) => {
  const userId = getUserId()
  return apiClient.delete(`/habits/${userId}/${id}`)
}

export const checkInHabit = async (id) => {
  const userId = getUserId()
  return apiClient.post(`/habits/${userId}/${id}/checkin`, {})
}

export const getHabitStats = async (id) => {
  const userId = getUserId()
  return apiClient.get(`/habits/${userId}/${id}/stats`)
}

// User endpoints
export const getUser = () => apiClient.get('/user')
export const updateUser = (userData) => apiClient.put('/user', userData)

// Auth endpoints
export const logoutUser = () => apiClient.post('/auth/logout', {})

// Stats endpoints
export const getStats = async () => {
  const userId = getUserId()
  return apiClient.get(`/stats/${userId}`)
}

export default apiClient

import { useState } from 'react'
import Button from './Button'

export default function AddHabitForm({ onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    category: 'health'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onAdd(formData)
      setFormData({
        name: '',
        description: '',
        frequency: 'daily',
        category: 'health'
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Habit Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Morning Jog, Read 20 pages"
          className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Why is this habit important to you?"
          className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition h-24"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Frequency</label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full bg-dark-tertiary border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
          >
            <option value="health">Health</option>
            <option value="fitness">Fitness</option>
            <option value="learning">Learning</option>
            <option value="productivity">Productivity</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          Create Habit
        </Button>
      </div>
    </form>
  )
}

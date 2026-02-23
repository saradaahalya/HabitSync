import Button from './Button'

export default function HabitList({ habits, onCheckIn, onDelete }) {
  const getStreakColor = (streak) => {
    if (streak > 30) return 'text-green-400'
    if (streak > 7) return 'text-primary'
    return 'text-gray-400'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {habits.map(habit => (
        <div key={habit.id} className="glass-card p-6 hover:bg-[rgba(19,24,41,0.8)] transition">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-1">{habit.name}</h3>
            <p className="text-sm text-gray-400">{habit.description}</p>
          </div>

          {/* Stats */}
          <div className="bg-dark-tertiary rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Frequency:</span>
              <span className="text-primary font-semibold">{habit.frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Streak:</span>
              <span className={`font-bold text-lg ${getStreakColor(habit.streak || 0)}`}>
                🔥 {habit.streak || 0} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last check-in:</span>
              <span className="text-gray-300">{habit.lastCheckin ? new Date(habit.lastCheckin).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={() => onCheckIn(habit.id)}
              variant="primary"
              size="md"
              className="flex-1"
            >
              ✓ Check In Today
            </Button>
            <Button 
              onClick={() => onDelete(habit.id)}
              variant="danger"
              size="md"
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

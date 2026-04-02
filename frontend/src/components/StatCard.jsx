export default function StatCard({ label, value }) {
  return (
    <div className="glass-card p-6 text-center hover:bg-[rgba(19,24,41,0.8)] transition">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        {value}
      </p>
    </div>
  )
}

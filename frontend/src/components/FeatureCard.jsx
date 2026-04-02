export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card p-4 hover:bg-[rgba(19,24,41,0.8)] transition-all">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold mb-1 text-primary">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

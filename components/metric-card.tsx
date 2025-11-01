interface MetricCardProps {
  label: string
  value: string
  target: string
  unit: string
  percentage: number
  icon: string
  status: "good" | "warning" | "critical"
}

export default function MetricCard({ label, value, target, unit, percentage, icon, status }: MetricCardProps) {
  const statusColors = {
    good: "bg-success-light border-success",
    warning: "bg-warning-light border-warning",
    critical: "bg-red-100 border-red-500",
  }

  const progressColors = {
    good: "bg-success",
    warning: "bg-warning",
    critical: "bg-red-500",
  }

  return (
    <div className={`bg-card-bg rounded-xl border ${statusColors[status]} p-6 card-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted mt-1">
            Target: {target} {unit}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-in-out ${progressColors[status]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-2">{percentage}% of daily goal</p>
    </div>
  )
}

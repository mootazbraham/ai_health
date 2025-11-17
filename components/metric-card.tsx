import { useLanguage } from "@/hooks/use-language"

interface MetricCardProps {
  label: string
  value: string
  target: string
  unit: string
  percentage: number
  icon: string
  status: "good" | "warning" | "critical"
  delay?: number
}

export default function MetricCard({
  label,
  value,
  target,
  unit,
  percentage,
  icon,
  status,
  delay = 0,
}: MetricCardProps) {
  const { t } = useLanguage()
  const statusConfig = {
    good: {
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      progress: "bg-gradient-to-r from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-500",
      text: "text-emerald-700",
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      border: "border-amber-200",
      progress: "bg-gradient-to-r from-amber-500 to-orange-500",
      iconBg: "bg-amber-500",
      text: "text-amber-700",
    },
    critical: {
      bg: "bg-gradient-to-br from-red-50 to-rose-50",
      border: "border-red-200",
      progress: "bg-gradient-to-r from-red-500 to-rose-500",
      iconBg: "bg-red-500",
      text: "text-red-700",
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={`card-modern p-6 ${config.bg} border-2 ${config.border} animate-scale-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500 font-medium">
            {t('Target')}: <span className="font-semibold">{target}</span> {unit}
          </p>
        </div>
        <div className={`w-14 h-14 ${config.iconBg} rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full ${config.progress} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse-slow" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-600">
            <span className={config.text}>{percentage}%</span> {t('of goal')}
          </p>
          {percentage >= 100 && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              {t('Achieved!')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

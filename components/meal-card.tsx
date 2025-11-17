interface MealCardProps {
  meal: {
    id: number
    mealName: string | null
    imageUrl: string | null
    calories: number | null
    protein: number | null
    carbs: number | null
    fat: number | null
    aiAnalysis: string | null
    createdAt: string
  }
}

export default function MealCard({ meal }: MealCardProps) {
  const mealName = meal.mealName || "Meal"
  const time = new Date(meal.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const calories = meal.calories || 0
  const protein = meal.protein || 0
  const carbs = meal.carbs || 0
  const fat = meal.fat || 0
  const image = meal.imageUrl || "/placeholder.svg"
  const aiAnalysis = meal.aiAnalysis || "No analysis available."
  return (
    <div className="group card-modern overflow-hidden hover:shadow-xl transition-all duration-500 animate-slide-up">
      <div className="flex flex-col md:flex-row gap-0">
        {/* Image Section */}
        <div className="md:w-48 md:h-48 w-full h-48 relative overflow-hidden">
          <img
            src={image}
            alt={mealName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-sm">🍽️</span>
              </div>
              <span className="text-white font-bold drop-shadow-lg">{time}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {mealName}
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  {calories} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-md transition-all">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Protein</p>
              <p className="text-lg font-bold text-blue-900">{Math.round(protein)}g</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition-all">
              <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Carbs</p>
              <p className="text-lg font-bold text-purple-900">{Math.round(carbs)}g</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 hover:shadow-md transition-all">
              <p className="text-xs font-semibold text-pink-600 uppercase mb-1">Fat</p>
              <p className="text-lg font-bold text-pink-900">{Math.round(fat)}g</p>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="relative p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-1 tracking-wide">AI Analysis</p>
                <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

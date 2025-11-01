interface Meal {
  id: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image: string
  aiAnalysis: string
}

interface MealCardProps {
  meal: Meal
}

export default function MealCard({ meal }: MealCardProps) {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden card-shadow">
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Image */}
        <div className="md:w-32 md:h-32 flex-shrink-0">
          <img src={meal.image || "/placeholder.svg"} alt={meal.name} className="w-full h-32 object-cover rounded-lg" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-lg font-bold text-foreground">{meal.name}</h4>
              <p className="text-sm text-muted">{meal.time}</p>
            </div>
            <span className="text-2xl font-bold text-accent">{meal.calories}</span>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-muted-light rounded-lg p-2">
              <p className="text-xs text-muted">Protein</p>
              <p className="text-sm font-bold text-foreground">{meal.protein}g</p>
            </div>
            <div className="bg-muted-light rounded-lg p-2">
              <p className="text-xs text-muted">Carbs</p>
              <p className="text-sm font-bold text-foreground">{meal.carbs}g</p>
            </div>
            <div className="bg-muted-light rounded-lg p-2">
              <p className="text-xs text-muted">Fat</p>
              <p className="text-sm font-bold text-foreground">{meal.fat}g</p>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-success-light border border-success rounded-lg p-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold">AI Analysis: </span>
              {meal.aiAnalysis}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

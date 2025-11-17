"use client"

import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { MetricsSummary } from "@/hooks/use-metrics"

interface HealthCalculationsProps {
  summary: MetricsSummary
}

export default function HealthCalculations({ summary }: HealthCalculationsProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  
  if (!user?.age || !user?.heightCm || !user?.weightKg) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">📊 {t('Personalized Health Insights')}</h3>
        <p className="text-gray-500">Complete your profile (age, height, weight) to see personalized health calculations!</p>
      </div>
    )
  }

  // BMI Calculation
  const heightM = user.heightCm / 100
  const bmi = user.weightKg / (heightM * heightM)
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: "Underweight", color: "text-blue-600" }
    if (bmi < 25) return { status: "Normal", color: "text-green-600" }
    if (bmi < 30) return { status: "Overweight", color: "text-yellow-600" }
    return { status: "Obese", color: "text-red-600" }
  }

  // BMR Calculation (Mifflin-St Jeor Equation)
  const bmr = user.gender === 'male' 
    ? (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age) + 5
    : (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age) - 161

  // Daily Calorie Needs (BMR * Activity Level)
  const dailyCalories = Math.round(bmr * 1.4) // Lightly active

  // Calorie Balance
  const calorieBalance = (summary.mealCalories || 0) - (summary.calories || 0)

  // Ideal Weight Range (BMI 18.5-24.9)
  const idealWeightMin = Math.round(18.5 * heightM * heightM)
  const idealWeightMax = Math.round(24.9 * heightM * heightM)

  const bmiStatus = getBMIStatus(bmi)

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-4">📊 {t('Personalized Health Insights')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BMI */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700">{t('Body Mass Index (BMI)')}</h4>
          <p className="text-2xl font-bold">{bmi.toFixed(1)}</p>
          <p className={`text-sm ${bmiStatus.color}`}>{t(bmiStatus.status)}</p>
        </div>

        {/* BMR */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700">{t('Basal Metabolic Rate')}</h4>
          <p className="text-2xl font-bold">{Math.round(bmr)}</p>
          <p className="text-sm text-gray-600">{t('calories/day at rest')}</p>
        </div>

        {/* Daily Calorie Needs */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700">{t('Daily Calorie Target')}</h4>
          <p className="text-2xl font-bold">{dailyCalories}</p>
          <p className="text-sm text-gray-600">{t('calories/day (lightly active)')}</p>
        </div>

        {/* Calorie Balance */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700">{t('Today\'s Calorie Balance')}</h4>
          <p className={`text-2xl font-bold ${calorieBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {calorieBalance > 0 ? '+' : ''}{calorieBalance}
          </p>
          <p className="text-sm text-gray-600">
            {calorieBalance > 0 ? t('Calorie surplus') : t('Calorie deficit')}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 {t('Recommendations')}</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {t('Ideal weight range')}: {idealWeightMin}-{idealWeightMax} kg</li>
          <li>• {t('Daily water target')}: {Math.round(user.weightKg * 35)}ml ({Math.round(user.weightKg * 35 / 250)} {t('glasses')})</li>
          <li>• {t('Daily steps target')}: {user.age > 65 ? '7,000' : '10,000'} {t('steps')}</li>
          {calorieBalance > 500 && <li>• {t('Consider increasing physical activity to balance calories')}</li>}
          {calorieBalance < -500 && <li>• {t('Consider eating more to meet your daily calorie needs')}</li>}
        </ul>
      </div>
    </div>
  )
}
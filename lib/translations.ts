export const translations = {
  en: {
    // Header
    "Hey": "Hey",
    "Ready to crush your fitness goals today?": "Ready to crush your fitness goals today?",
    "Connect Strava": "🏃 Connect Strava",
    "Sync Data": "📊 Sync Data",
    
    // Metrics
    "Distance": "Distance",
    "Activities": "Activities", 
    "Food Calories": "Food Calories",
    "Exercise Calories": "Exercise Calories",
    "Avg Speed": "Avg Speed",
    "Exercise Time": "Exercise Time",
    "Steps": "Steps",
    "Water": "Water",
    "Sleep": "Sleep",
    "Target": "Target",
    "today": "today",
    "Achieved!": "✅ Achieved!",
    
    // Navigation
    "Overview": "Overview",
    "Energy Balance": "Energy Balance", 
    "Training Coach": "Training Coach",
    "Meal Planner": "Meal Planner",
    "Load Analytics": "Load Analytics",
    "AI Coach": "AI Coach",
    "Achievements": "Achievements",
    "Body Composition": "Body Composition",
    
    // Training Coach
    "AI Training Coach": "🏋️ AI Training Coach",
    "Create New Plan": "Create New Plan",
    "This Week's Workouts": "This Week's Workouts",
    "Mark Complete": "Mark Complete",
    "Completed": "✓ Completed"
  },
  
  fr: {
    // Header
    "Hey": "Salut",
    "Ready to crush your fitness goals today?": "Prêt à atteindre tes objectifs fitness aujourd'hui?",
    "Connect Strava": "🏃 Connecter Strava",
    "Sync Data": "📊 Synchroniser",
    
    // Metrics
    "Distance": "Distance",
    "Activities": "Activités",
    "Food Calories": "Calories Alimentaires", 
    "Exercise Calories": "Calories Exercice",
    "Avg Speed": "Vitesse Moy.",
    "Exercise Time": "Temps d'Exercice",
    "Steps": "Pas",
    "Water": "Eau",
    "Sleep": "Sommeil",
    "Target": "Objectif",
    "today": "aujourd'hui",
    "Achieved!": "✅ Atteint!",
    
    // Navigation
    "Overview": "Aperçu",
    "Energy Balance": "Bilan Énergétique",
    "Training Coach": "Coach d'Entraînement", 
    "Meal Planner": "Planificateur de Repas",
    "Load Analytics": "Analyse de Charge",
    "AI Coach": "Coach IA",
    "Achievements": "Réussites",
    "Body Composition": "Composition Corporelle",
    
    // Training Coach
    "AI Training Coach": "🏋️ Coach IA d'Entraînement",
    "Create New Plan": "Créer Nouveau Plan",
    "This Week's Workouts": "Entraînements de Cette Semaine",
    "Mark Complete": "Marquer Terminé",
    "Completed": "✓ Terminé"
  },
  
  ar: {
    // Header
    "Hey": "مرحبا",
    "Ready to crush your fitness goals today?": "مستعد لتحقيق أهدافك الرياضية اليوم؟",
    "Connect Strava": "🏃 ربط ستريفا",
    "Sync Data": "📊 مزامنة البيانات",
    
    // Metrics
    "Distance": "المسافة",
    "Activities": "الأنشطة",
    "Food Calories": "سعرات الطعام",
    "Exercise Calories": "سعرات التمرين", 
    "Avg Speed": "السرعة المتوسطة",
    "Exercise Time": "وقت التمرين",
    "Steps": "الخطوات",
    "Water": "الماء",
    "Sleep": "النوم",
    "Target": "الهدف",
    "today": "اليوم",
    "Achieved!": "✅ تم تحقيقه!",
    
    // Navigation
    "Overview": "نظرة عامة",
    "Energy Balance": "توازن الطاقة",
    "Training Coach": "مدرب التدريب",
    "Meal Planner": "مخطط الوجبات", 
    "Load Analytics": "تحليل الأحمال",
    "AI Coach": "المدرب الذكي",
    "Achievements": "الإنجازات",
    "Body Composition": "تركيب الجسم",
    
    // Training Coach
    "AI Training Coach": "🏋️ المدرب الذكي للتدريب",
    "Create New Plan": "إنشاء خطة جديدة",
    "This Week's Workouts": "تمارين هذا الأسبوع",
    "Mark Complete": "تحديد كمكتمل",
    "Completed": "✓ مكتمل"
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en
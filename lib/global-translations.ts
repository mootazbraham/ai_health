// Global translation wrapper to translate all hardcoded strings
export function translateInsights(text: string, t: (key: string) => string): string {
  // Replace common patterns with translations
  return text
    .replace(/Great job! You're (\d+)% towards your daily step goal\./, (match, percent) => 
      `${t('Great job! You\\'re')} ${percent}${t('% towards your daily step goal.')}`)
    .replace(/Amazing! You completed (\d+) workout(s?) today!/, (match, count, s) => 
      `${t('Amazing! You completed')} ${count} ${s ? t('workouts today!') : t('workout today!')}`)
    .replace(/You covered ([\d.]+)km today - that's like running (\d+) laps around a track!/, (match, km, laps) => 
      `${t('You covered')} ${km}${t('km today - that\\'s like running')} ${laps} ${t('laps around a track!')}`)
    .replace(/You spent (\d+) minutes being active\. Every minute counts!/, (match, minutes) => 
      `${t('You spent')} ${minutes} ${t('minutes being active. Every minute counts!')}`)
    .replace(/Connect Strava and start your fitness journey to see personalized insights!/, 
      t('Connect Strava and start your fitness journey to see personalized insights!'))
    .replace(/Sync your activities to unlock detailed performance analytics!/, 
      t('Sync your activities to unlock detailed performance analytics!'))
}
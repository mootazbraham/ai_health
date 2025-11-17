import { translations, Language } from './translations-full'

// Global translation function that can be used anywhere
export function globalTranslate(text: string, language: Language = 'en'): string {
  // Direct translation lookup
  const translation = translations[language][text as keyof typeof translations.en]
  if (translation) {
    return translation
  }
  
  // Pattern matching for dynamic content
  const patterns = [
    {
      pattern: /^Target:\s*(.+)$/,
      replace: (match: string, target: string) => `${translations[language]['Target'] || 'Target'}: ${target}`
    },
    {
      pattern: /^(\d+)%\s*of\s*goal$/,
      replace: (match: string, percent: string) => `${percent}% ${translations[language]['of goal'] || 'of goal'}`
    },
    {
      pattern: /^✅\s*Achieved!$/,
      replace: () => translations[language]['Achieved!'] || '✅ Achieved!'
    },
    {
      pattern: /^Great job! You're (\d+)% towards your daily step goal\.$/,
      replace: (match: string, percent: string) => 
        `${translations[language]["Great job! You're"] || "Great job! You're"} ${percent}${translations[language]["% towards your daily step goal."] || "% towards your daily step goal."}`
    },
    {
      pattern: /^Amazing! You completed (\d+) workout(s?) today!$/,
      replace: (match: string, count: string, s: string) => 
        `${translations[language]["Amazing! You completed"] || "Amazing! You completed"} ${count} ${s ? translations[language]["workouts today!"] || "workouts today!" : translations[language]["workout today!"] || "workout today!"}`
    },
    {
      pattern: /^(\d+)\s+(meal|meals)$/,
      replace: (match: string, count: string, mealText: string) => 
        `${count} ${mealText === 'meal' ? translations[language]['meal'] || 'meal' : translations[language]['meals'] || 'meals'}`
    },
    {
      pattern: /^(\d+)\s+kcal\s+left$/,
      replace: (match: string, count: string) => 
        `${count} ${translations[language]['kcal left'] || 'kcal left'}`
    },
    {
      pattern: /^of\s+(\d+)\s+(\w+)$/,
      replace: (match: string, amount: string, unit: string) => 
        `${translations[language]['of'] || 'of'} ${amount} ${unit}`
    }
  ]
  
  for (const { pattern, replace } of patterns) {
    const match = text.match(pattern)
    if (match) {
      return replace(text, ...match.slice(1))
    }
  }
  
  return text // Return original if no translation found
}

// Auto-translate all text content on page
export function autoTranslateDOM(language: Language) {
  if (typeof window === 'undefined') return
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  const textNodes: Text[] = []
  let node: Text | null
  
  while (node = walker.nextNode() as Text) {
    if (node.textContent && node.textContent.trim()) {
      textNodes.push(node)
    }
  }
  
  textNodes.forEach(textNode => {
    const originalText = textNode.textContent?.trim()
    if (originalText) {
      const translated = globalTranslate(originalText, language)
      if (translated !== originalText) {
        textNode.textContent = translated
      }
    }
  })
}
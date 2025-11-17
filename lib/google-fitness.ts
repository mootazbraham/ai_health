const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!

const FITNESS_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read'
]

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    scope: FITNESS_SCOPES.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function getTokens(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI
    })
  })
  return response.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })
  return response.json()
}

export async function getFitnessData(accessToken: string) {
  const endTime = Date.now()
  const startTime = endTime - (24 * 60 * 60 * 1000) // Last 24 hours
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }

  try {
    // Get steps data
    const stepsResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: startTime.toString(),
          endTimeMillis: endTime.toString()
        })
      }
    )
    
    const stepsData = await stepsResponse.json()
    const steps = stepsData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0

    // Get heart rate data
    const heartRateResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime.toString(),
          endTimeMillis: endTime.toString()
        })
      }
    )
    
    const heartRateData = await heartRateResponse.json()
    const heartRate = heartRateData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0

    return {
      steps: Math.round(steps),
      heartRate: Math.round(heartRate),
      calories: Math.round(steps * 0.04), // Rough estimate
      sleep: 0 // Sleep data requires different API
    }
  } catch (error) {
    console.error('Error fetching fitness data:', error)
    return { steps: 0, heartRate: 0, calories: 0, sleep: 0 }
  }
}
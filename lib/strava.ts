const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI!

export function getStravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    scope: 'read,activity:read_all',
    approval_prompt: 'force'
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function getStravaTokens(code: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
  })
  return response.json()
}

export async function refreshStravaToken(refreshToken: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })
  return response.json()
}

export async function getStravaAthlete(accessToken: string) {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  return response.json()
}

export async function getStravaActivities(accessToken: string, refreshToken?: string) {
  let response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  let data = await response.json()
  
  console.log('Strava API response:', data)
  
  // If token is invalid, try to refresh
  if (!response.ok && refreshToken && data.message === 'Authorization Error') {
    console.log('Token expired, refreshing...')
    const tokenData = await refreshStravaToken(refreshToken)
    if (tokenData.access_token) {
      // Retry with new token
      response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
      data = await response.json()
      return { ...data, newAccessToken: tokenData.access_token }
    }
  }
  
  // Check if response is an error
  if (!response.ok || !Array.isArray(data)) {
    console.error('Strava API error:', data)
    return {
      steps: 0,
      calories: 0,
      activities: 0,
      distance: 0,
      error: data.message || 'Failed to fetch activities'
    }
  }
  
  const activities = data
  
  // Convert to health metrics
  const totalDistance = activities.reduce((sum: number, act: any) => sum + (act.distance || 0), 0)
  const totalCalories = activities.reduce((sum: number, act: any) => sum + (act.calories || act.kilojoules/4.184 || 0), 0)
  const totalTime = activities.reduce((sum: number, act: any) => sum + (act.moving_time || 0), 0)
  const totalElevation = activities.reduce((sum: number, act: any) => sum + (act.total_elevation_gain || 0), 0)
  const maxSpeed = Math.max(...activities.map((act: any) => act.max_speed || 0))
  const avgSpeed = totalTime > 0 ? (totalDistance / totalTime) * 3.6 : 0
  
  // Estimate steps from distance (rough calculation: 1 meter = 1.3 steps)
  const estimatedSteps = Math.round(totalDistance * 1.3)
  
  console.log('Activity details:', activities.map(act => ({
    name: act.name,
    distance: act.distance,
    calories: act.calories,
    kilojoules: act.kilojoules,
    elevation: act.total_elevation_gain,
    time: act.moving_time
  })))
  
  // Activity types breakdown
  const activityTypes = activities.reduce((acc: any, act: any) => {
    acc[act.sport_type] = (acc[act.sport_type] || 0) + 1
    return acc
  }, {})
  
  // GPS data from activities
  const gpsData = activities.map((act: any) => ({
    id: act.id,
    name: act.name,
    startLat: act.start_latlng?.[0],
    startLng: act.start_latlng?.[1],
    endLat: act.end_latlng?.[0],
    endLng: act.end_latlng?.[1],
    polyline: act.map?.summary_polyline,
    city: act.location_city,
    country: act.location_country
  })).filter(act => act.startLat && act.startLng)
  
  return {
    distance: Math.round(totalDistance), // meters
    calories: Math.round(totalCalories),
    steps: estimatedSteps, // estimated from distance
    activities: activities.length,
    avgSpeed: Math.round(avgSpeed * 100) / 100, // km/h
    maxSpeed: Math.round(maxSpeed * 3.6 * 100) / 100, // km/h
    totalTime: Math.round(totalTime / 60), // minutes
    elevation: Math.round(totalElevation), // meters
    activityTypes,
    gpsData
  }
}
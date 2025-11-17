// Test script to get Strava connect URL
const STRAVA_CLIENT_ID = '185530'
const STRAVA_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/strava/callback'

const params = new URLSearchParams({
  client_id: STRAVA_CLIENT_ID,
  redirect_uri: STRAVA_REDIRECT_URI,
  response_type: 'code',
  scope: 'read,activity:read_all',
  approval_prompt: 'force'
})

const authUrl = `https://www.strava.com/oauth/authorize?${params}`
console.log('Visit this URL to connect Strava:')
console.log(authUrl)
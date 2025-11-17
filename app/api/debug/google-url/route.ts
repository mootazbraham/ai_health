import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-fitness'

export async function GET() {
  const authUrl = getAuthUrl()
  return NextResponse.json({ 
    authUrl,
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  })
}
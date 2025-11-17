import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-fitness'

export async function GET(request: NextRequest) {
  try {
    const authUrl = getAuthUrl()
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Google connect error:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
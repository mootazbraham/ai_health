import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const token = '1a55eac12faa8f79b91a5ba05c64bca178c4b00e'
    
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await response.json()
    
    return NextResponse.json({ 
      success: response.ok,
      status: response.status,
      data 
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error' })
  }
}
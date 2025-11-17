import { NextRequest } from 'next/server'

export function getUserIdFromCookies(request: NextRequest): number | null {
  const userIdCookie = request.cookies.get('userId')
  if (!userIdCookie) return null
  
  const userId = parseInt(userIdCookie.value)
  return isNaN(userId) ? null : userId
}

export function setUserIdCookie(userId: number): string {
  return `userId=${userId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
}

export function clearUserIdCookie(): string {
  return `userId=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTokens() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 2 },
      select: { 
        id: true, 
        email: true, 
        stravaAccessToken: true, 
        stravaRefreshToken: true 
      }
    })
    console.log('User:', user)
    console.log('Has Strava token:', !!user?.stravaAccessToken)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTokens()
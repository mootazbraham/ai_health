const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkConversation() {
  try {
    const conversations = await prisma.conversation.findMany({
      select: { id: true, userId: true, title: true }
    })
    console.log('All conversations:', conversations)
    
    const conversation1 = await prisma.conversation.findFirst({
      where: { id: 1 }
    })
    console.log('Conversation 1:', conversation1)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkConversation()
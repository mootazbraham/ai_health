import { NextResponse, type NextRequest } from "next/server"
import { verifyToken } from "@/lib/security"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const userId = parseInt(decoded.userId, 10)

  const formData = await request.formData()
  const file = formData.get("photo") as File | null
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let photoUrl: string
  try {
    console.log('[DEBUG] Uploading profile photo to MinIO...')
    const { uploadToMinio } = await import('@/lib/minio-client')
    const filename = `user_${userId}_${Date.now()}_${file.name}`
    photoUrl = await uploadToMinio(filename, buffer, file.type || 'image/jpeg')
    console.log('✅ Profile photo uploaded to MinIO:', photoUrl)
  } catch (e) {
    console.error('❌ MinIO upload failed for profile photo:', e)
    // Save to local uploads folder as fallback
    const fs = require('fs')
    const path = require('path')
    const filename = `user_${userId}_${Date.now()}.jpg`
    const uploadPath = path.join(process.cwd(), 'data', 'uploads', filename)
    
    // Ensure directory exists
    const dir = path.dirname(uploadPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(uploadPath, buffer)
    photoUrl = `/api/meals/image/${filename}`
    console.log('✅ Profile photo saved locally:', photoUrl)
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { photoUrl }, select: { id: true, photoUrl: true } })
  return NextResponse.json({ success: true, photoUrl: user.photoUrl, user })
}




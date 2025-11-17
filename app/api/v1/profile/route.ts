import { NextResponse, type NextRequest } from "next/server"
import { verifyToken } from "@/lib/security"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const userId = parseInt(decoded.userId, 10)

  const user = await prisma.user.findUnique({ where: { id: userId }, select: {
    id: true, email: true, name: true, age: true, heightCm: true, weightKg: true, gender: true, locale: true, photoUrl: true
  }})
  return NextResponse.json({ success: true, user })
}

export async function PATCH(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const userId = parseInt(decoded.userId, 10)
  const body = await request.json()

  const data: any = {}
  if (body.name != null) data.name = String(body.name)
  if (body.email != null) data.email = String(body.email)
  if (body.photoUrl != null) data.photoUrl = String(body.photoUrl)
  if (body.gender != null) data.gender = String(body.gender)
  if (body.locale != null) data.locale = String(body.locale)
  if (body.age != null) data.age = parseInt(body.age, 10)
  if (body.heightCm != null) data.heightCm = parseFloat(body.heightCm)
  if (body.weightKg != null) data.weightKg = parseFloat(body.weightKg)

  const user = await prisma.user.update({ where: { id: userId }, data, select: {
    id: true, email: true, name: true, age: true, heightCm: true, weightKg: true, gender: true, locale: true, photoUrl: true
  }})
  return NextResponse.json({ success: true, user })
}




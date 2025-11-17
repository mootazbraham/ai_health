import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const compositions = await prisma.bodyComposition.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { recordedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ compositions })
  } catch (error) {
    console.error('Error fetching body compositions:', error)
    return NextResponse.json({ error: 'Failed to fetch body compositions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, weight, bodyFat, muscleMass, visceralFat } = await request.json()

    if (!userId || !weight || !bodyFat || !muscleMass || !visceralFat) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const composition = await prisma.bodyComposition.create({
      data: {
        userId: parseInt(userId),
        weight: parseFloat(weight),
        bodyFat: parseFloat(bodyFat),
        muscleMass: parseFloat(muscleMass),
        visceralFat: parseFloat(visceralFat)
      }
    })

    return NextResponse.json({ composition })
  } catch (error) {
    console.error('Error creating body composition:', error)
    return NextResponse.json({ error: 'Failed to create body composition' }, { status: 500 })
  }
}
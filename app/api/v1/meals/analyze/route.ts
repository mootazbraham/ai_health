import { type NextRequest, NextResponse } from "next/server"
import { processImage, validateImage, imageToBase64 } from "@/lib/image-processor"
import { analyzeMealImage } from "@/lib/ai-vision"
import { createMealPrisma } from "@/lib/prisma-helpers"
import { verifyToken } from "@/lib/security"
import { logAuditEvent } from "@/lib/audit-log"

export async function POST(request: NextRequest) {
  try {
    console.log('🍽️ Meal analyze endpoint called')
    const formData = await request.formData()
    const file = formData.get("image") as File
    let userId = formData.get("userId") as string
    const mealName = (formData.get("mealName") as string) || undefined
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    console.log('📝 Request data:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size,
      userId, 
      mealName, 
      hasToken: !!token 
    })

    if (!file) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 })
    }

    // userId from form is ignored; we use the authenticated user's ID

    // Security: Require authentication
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      logAuditEvent('UNAUTHORIZED_ACCESS', {
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { endpoint: 'POST /meals/analyze', reason: 'Invalid token' },
        severity: 'WARNING',
      })
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Security: Verify resource ownership
    const tokenUserId = parseInt(decoded.userId, 10)
    let requestUserId: number | null = null
    
    if (userId) {
      requestUserId = parseInt(userId, 10)
      if (tokenUserId !== requestUserId) {
        logAuditEvent('UNAUTHORIZED_ACCESS', {
          userId: decoded.userId,
          ip: request.headers.get('x-forwarded-for') || undefined,
          details: { endpoint: 'POST /meals/analyze', attemptedUserId: userId },
          severity: 'ERROR',
        })
        return NextResponse.json({ error: "Unauthorized: You can only create meals for yourself" }, { status: 403 })
      }
    }

    // Use authenticated user's ID
    const finalUserId = tokenUserId

    // Validate image
    const validation = validateImage(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Process image (resize, optimize)
    const processedImage = await processImage(fileBuffer, file.name)

    // Convert to base64 for AI API
    const imageBase64 = imageToBase64(processedImage.original.buffer)

    // Analyze with AI Vision
    let analysis
    try {
      analysis = await analyzeMealImage(imageBase64, mealName)
    } catch (aiError: any) {
      console.error("[API] AI Vision error:", aiError)
      
      // Fallback with simple deterministic variation based on mealName
      const seedStr = (mealName || file.name || "meal").toLowerCase()
      const seed = Array.from(seedStr).reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const rand = (min: number, max: number) => Math.round(min + ((seed % 97) / 97) * (max - min))

      const baseCalories = rand(300, 700)
      const baseProtein = rand(10, 40)
      const baseCarbs = rand(20, 80)
      const baseFat = rand(5, 30)
      const classes = ["Healthy", "Moderate", "Treat"] as const
      const classification = classes[seed % classes.length]

      analysis = {
        items: mealName ? [mealName] : ["Food items detected"],
        calories: baseCalories,
        protein: baseProtein,
        carbs: baseCarbs,
        fat: baseFat,
        classification,
        assessment: "AI vision unavailable. Estimated macros generated.",
        recommendation: "Review and adjust values if needed.",
      }
    }

    // Upload to storage (MinIO or fallback to local)
    console.log('🔥 REACHED UPLOAD SECTION - TESTING MINIO')
    let imageUrl: string | null = null
    try {
      // Try MinIO first
      console.log('[DEBUG] Starting MinIO upload process...')
      console.log('[DEBUG] File name:', processedImage.fileName)
      console.log('[DEBUG] Buffer size:', processedImage.original.buffer.length)
      console.log('[DEBUG] MinIO config:', {
        endpoint: process.env.MINIO_ENDPOINT,
        port: process.env.MINIO_PORT,
        accessKey: process.env.MINIO_ACCESS_KEY ? 'SET' : 'NOT_SET',
        secretKey: process.env.MINIO_SECRET_KEY ? 'SET' : 'NOT_SET'
      })
      
      const { uploadToMinio } = await import('@/lib/minio-client')
      console.log('[DEBUG] MinIO client imported successfully')
      
      imageUrl = await uploadToMinio(
        processedImage.fileName,
        processedImage.original.buffer,
        'image/jpeg'
      )
      console.log('✅ Image uploaded to MinIO:', imageUrl)
    } catch (storageError) {
      console.log('🔥 MINIO UPLOAD FAILED - FALLING BACK TO LOCAL')
      console.error("❌ MinIO upload failed:", {
        message: storageError.message,
        stack: storageError.stack,
        name: storageError.name
      })
      
      // Fallback to local file storage
      const fs = await import('fs/promises')
      const path = await import('path')
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads')
      
      // Ensure uploads directory exists
      try {
        await fs.mkdir(uploadsDir, { recursive: true })
      } catch {}
      
      // Save file locally
      const filePath = path.join(uploadsDir, processedImage.fileName)
      await fs.writeFile(filePath, processedImage.original.buffer)
      imageUrl = `/api/meals/image/${processedImage.fileName}`
      console.log('✅ Image saved locally:', imageUrl)
    }

    // Store meal in database (Prisma + MySQL)
    const meal = await createMealPrisma({
      userId: finalUserId,
      mealName: mealName || analysis.items.join(", "),
      calories: Math.round(analysis.calories),
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      fiber: analysis.fiber,
      imageUrl,
      aiAnalysis: `${analysis.assessment} ${analysis.recommendation}`,
      classification: analysis.classification,
      assessment: analysis.assessment,
      recommendation: analysis.recommendation,
    })
    
    // Also store calories as health metric
    const { prisma } = await import('@/lib/prisma')
    await prisma.metric.create({
      data: {
        userId: finalUserId,
        type: 'meal_calories',
        value: Math.round(analysis.calories),
        unit: 'kcal',
        recordedAt: new Date()
      }
    })

    // Security: Log data modification
    logAuditEvent('DATA_MODIFY', {
      userId: decoded.userId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { resource: 'meals', action: 'create' },
      severity: 'INFO',
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log("[API] Meal analyzed and stored:", meal.id)
    }

    return NextResponse.json({
      success: true,
      meal: {
        id: meal.id,
        userId: meal.userId,
        mealName: meal.mealName,
        imageUrl: meal.imageUrl,
        analysis: {
          items: analysis.items,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: analysis.fat,
          fiber: analysis.fiber,
          classification: analysis.classification,
          assessment: analysis.assessment,
          recommendation: analysis.recommendation,
        },
        createdAt: meal.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[API] Meal analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze meal", details: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : "Unknown error" },
      { status: 500 }
    )
  }
}

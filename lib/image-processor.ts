import crypto from "crypto"
import fs from "fs"
import path from "path"

// Dynamic import for sharp (optional dependency)
let sharp: any
try {
  sharp = require("sharp")
} catch (e) {
  console.warn("[ImageProcessor] Sharp not available, using basic processing")
}

// Image processing configuration
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"]
const PROCESSED_SIZE = { width: 800, height: 600 }
const THUMBNAIL_SIZE = { width: 200, height: 200 }

export interface ProcessedImage {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
}

export interface ImageProcessingResult {
  original: ProcessedImage
  thumbnail: ProcessedImage
  fileName: string
  filePath: string
}

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid format. Allowed: ${ALLOWED_FORMATS.join(", ")}`,
    }
  }

  return { valid: true }
}

/**
 * Process and optimize image
 */
export async function processImage(fileBuffer: Buffer, fileName: string): Promise<ImageProcessingResult> {
  // Generate unique filename
  const fileExt = path.extname(fileName).toLowerCase() || ".jpg"
  const uniqueName = `${crypto.randomUUID()}${fileExt}`

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "data", "uploads")
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, uniqueName)

  // If sharp is available, use it for optimization
  if (sharp) {
    try {
      // Process original image (resize and optimize)
      const originalBuffer = await sharp(fileBuffer)
        .resize(PROCESSED_SIZE.width, PROCESSED_SIZE.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer()

      const originalMeta = await sharp(originalBuffer).metadata()

      // Create thumbnail
      const thumbnailBuffer = await sharp(fileBuffer)
        .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
          fit: "cover",
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnailMeta = await sharp(thumbnailBuffer).metadata()

      // Save processed image
      fs.writeFileSync(filePath, originalBuffer)

      return {
        original: {
          buffer: originalBuffer,
          format: "image/jpeg",
          width: originalMeta.width || 0,
          height: originalMeta.height || 0,
          size: originalBuffer.length,
        },
        thumbnail: {
          buffer: thumbnailBuffer,
          format: "image/jpeg",
          width: thumbnailMeta.width || 0,
          height: thumbnailMeta.height || 0,
          size: thumbnailBuffer.length,
        },
        fileName: uniqueName,
        filePath: filePath,
      }
    } catch (error) {
      console.warn("[ImageProcessor] Sharp processing failed, using basic processing:", error)
    }
  }

  // Fallback: Save original file without processing
  fs.writeFileSync(filePath, fileBuffer)

  return {
    original: {
      buffer: fileBuffer,
      format: "image/jpeg",
      width: 800,
      height: 600,
      size: fileBuffer.length,
    },
    thumbnail: {
      buffer: fileBuffer,
      format: "image/jpeg",
      width: 200,
      height: 200,
      size: fileBuffer.length,
    },
    fileName: uniqueName,
    filePath: filePath,
  }
}

/**
 * Convert image to base64 for AI API
 */
export function imageToBase64(imageBuffer: Buffer): string {
  return imageBuffer.toString("base64")
}

/**
 * Convert base64 to buffer
 */
export function base64ToImage(base64: string): Buffer {
  return Buffer.from(base64, "base64")
}

/**
 * Delete image file
 */
export function deleteImage(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error("[ImageProcessor] Error deleting image:", error)
  }
}


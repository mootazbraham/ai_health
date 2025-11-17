/**
 * Cloud Storage Integration
 * Supports both MinIO (local) and AWS S3 (production)
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream"
import fs from "fs"
import path from "path"

// Storage configuration
const useMinIO = process.env.USE_MINIO === "true"
const storageType = useMinIO ? "minio" : "s3"

// MinIO Configuration (Local development)
// Security: Fail fast if credentials not provided in production
const minioConfig = {
  endpoint: process.env.MINIO_ENDPOINT || (process.env.NODE_ENV === 'production' ? undefined : "http://localhost:9000"),
  accessKeyId: process.env.MINIO_ACCESS_KEY || (process.env.NODE_ENV === 'production' ? undefined : "minioadmin"),
  secretAccessKey: process.env.MINIO_SECRET_KEY || (process.env.NODE_ENV === 'production' ? undefined : "minioadmin"),
  region: "us-east-1",
  forcePathStyle: true, // Required for MinIO
}

// Security: Validate MinIO credentials in production
if (useMinIO && process.env.NODE_ENV === 'production') {
  if (!minioConfig.endpoint || !minioConfig.accessKeyId || !minioConfig.secretAccessKey) {
    throw new Error(
      "[SECURITY] MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY must be set in production. " +
      "Default credentials are not allowed."
    )
  }
}

// AWS S3 Configuration (Production)
const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
}

// Initialize S3 client (works for both MinIO and AWS S3)
const s3Client = new S3Client(
  useMinIO
    ? minioConfig
    : {
        ...s3Config,
        ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
      }
)

const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.MINIO_BUCKET || "healthai-images"

/**
 * Upload file to cloud storage
 */
export async function uploadToStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  // Create folder structure: meal-images/{userId}/{fileName}
  const key = `meal-images/${fileName}`

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // Enable encryption at rest if using S3
      ...(storageType === "s3" && {
        ServerSideEncryption: "AES256",
      }),
    })

    await s3Client.send(command)

    // Return URL (MinIO uses different URL format)
    if (useMinIO) {
      const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000"
      return `${endpoint}/${BUCKET_NAME}/${key}`
    } else {
      return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`
    }
  } catch (error) {
    console.error("[Storage] Upload error:", error)
    throw new Error(`Failed to upload to storage: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Download file from cloud storage
 */
export async function downloadFromStorage(fileKey: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      throw new Error("Empty response body")
    }

    // Convert stream to buffer
    const stream = response.Body as Readable
    const chunks: Buffer[] = []

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }

    return Buffer.concat(chunks)
  } catch (error) {
    console.error("[Storage] Download error:", error)
    throw new Error(`Failed to download from storage: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete file from cloud storage
 */
export async function deleteFromStorage(fileKey: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error("[Storage] Delete error:", error)
    throw new Error(`Failed to delete from storage: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Local file storage fallback (when cloud storage not configured)
 */
export function saveFileLocally(fileBuffer: Buffer, fileName: string): string {
  const uploadsDir = path.join(process.cwd(), "data", "uploads")
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, fileName)
  fs.writeFileSync(filePath, fileBuffer)

  return filePath
}

/**
 * Get file from local storage
 */
export function getLocalFile(filePath: string): Buffer | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath)
    }
    return null
  } catch (error) {
    console.error("[Storage] Local file read error:", error)
    return null
  }
}

/**
 * Check if cloud storage is configured
 */
export function isCloudStorageConfigured(): boolean {
  if (useMinIO) {
    return !!(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY)
  } else {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  }
}


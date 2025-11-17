import { Client } from 'minio'

// MinIO client configuration
const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
const cleanEndpoint = endpoint.replace('http://', '').replace('https://', '')
const [host, portStr] = cleanEndpoint.split(':')

const minioClient = new Client({
  endPoint: host || 'localhost',
  port: parseInt(portStr || process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'vitalis-uploads'

// Initialize bucket
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' created`)
    }
  } catch (error) {
    console.error('❌ MinIO bucket initialization failed:', error)
  }
}

// Upload file to MinIO
export async function uploadToMinio(
  fileName: string, 
  fileBuffer: Buffer, 
  contentType: string = 'application/octet-stream'
): Promise<string> {
  try {
    console.log('[MINIO] Starting upload process...')
    console.log('[MINIO] Client config:', {
      endPoint: process.env.MINIO_ENDPOINT?.replace('http://', '') || 'localhost',
      port: 9000,
      bucket: BUCKET_NAME,
      fileName,
      bufferSize: fileBuffer.length,
      contentType
    })
    
    await initializeBucket()
    console.log('[MINIO] Bucket initialized')
    
    const objectName = `${Date.now()}-${fileName}`
    console.log('[MINIO] Uploading object:', objectName)
    
    const result = await minioClient.putObject(BUCKET_NAME, objectName, fileBuffer, {
      'Content-Type': contentType
    })
    console.log('[MINIO] Upload result:', result)
    
    // Verify the upload
    const stat = await minioClient.statObject(BUCKET_NAME, objectName)
    console.log('[MINIO] File stat after upload:', stat)
    
    // Return the file URL
    const fileUrl = `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${objectName}`
    console.log(`✅ File uploaded to MinIO: ${fileUrl}`)
    return fileUrl
  } catch (error) {
    console.error('❌ MinIO upload failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    })
    throw new Error(`Failed to upload file to storage: ${error.message}`)
  }
}

// Get file from MinIO
export async function getFromMinio(objectName: string): Promise<Buffer> {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, objectName)
    const chunks: Buffer[] = []
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('❌ MinIO download failed:', error)
    throw new Error('Failed to download file from storage')
  }
}

// Delete file from MinIO
export async function deleteFromMinio(objectName: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName)
    console.log(`✅ File deleted from MinIO: ${objectName}`)
  } catch (error) {
    console.error('❌ MinIO delete failed:', error)
    throw new Error('Failed to delete file from storage')
  }
}

export { minioClient, BUCKET_NAME }
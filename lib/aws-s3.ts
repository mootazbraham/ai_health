import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'vitalis-health-app'

export async function uploadToS3(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const objectName = `meals/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
    Body: fileBuffer,
    ContentType: contentType,
  })

  await s3Client.send(command)
  
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${objectName}`
}

export async function getFromS3(objectName: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
  })

  const response = await s3Client.send(command)
  const chunks: Uint8Array[] = []
  
  if (response.Body) {
    const stream = response.Body as any
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
  }
  
  return Buffer.concat(chunks)
}
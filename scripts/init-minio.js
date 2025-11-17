const { Client } = require('minio')

const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
})

async function initMinIO() {
  try {
    console.log('🔄 Initializing MinIO...')
    
    // Create bucket if it doesn't exist
    const bucketExists = await minioClient.bucketExists('vitalis-uploads')
    if (!bucketExists) {
      await minioClient.makeBucket('vitalis-uploads', 'us-east-1')
      console.log('✅ Bucket "vitalis-uploads" created')
    } else {
      console.log('✅ Bucket "vitalis-uploads" already exists')
    }
    
    // Set bucket policy for public read access to images
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: ['arn:aws:s3:::vitalis-uploads/*']
      }]
    }
    
    await minioClient.setBucketPolicy('vitalis-uploads', JSON.stringify(policy))
    console.log('✅ Bucket policy set for public read access')
    
    console.log('🎉 MinIO initialization complete!')
    console.log('📁 Access MinIO Console: http://localhost:9001')
    console.log('🔑 Login: minioadmin / minioadmin123')
    
  } catch (error) {
    console.error('❌ MinIO initialization failed:', error.message)
    process.exit(1)
  }
}

initMinIO()
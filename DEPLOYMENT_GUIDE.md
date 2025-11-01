# HealthAI - Deployment & Setup Guide

## Prerequisites

- Node.js 18+
- AWS Account with appropriate permissions
- Docker (optional, for containerization)
- Git

## Local Development Setup

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/yourusername/healthai.git
cd healthai
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Create `.env.local`:
\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/healthai

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=healthai-bucket

# AI APIs
OPENAI_API_KEY=your_openai_key
GOOGLE_VISION_API_KEY=your_vision_key

# Authentication
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

## AWS Deployment

### 1. Create AWS Resources

\`\`\`bash
# Create S3 bucket
aws s3 mb s3://healthai-bucket --region us-east-1

# Create RDS database
aws rds create-db-instance \
  --db-instance-identifier healthai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePassword123!

# Create Lambda execution role
aws iam create-role \
  --role-name HealthAILambdaRole \
  --assume-role-policy-document file://trust-policy.json
\`\`\`

### 2. Deploy to AWS Lambda

\`\`\`bash
# Build
npm run build

# Create deployment package
zip -r deployment.zip .next node_modules

# Deploy
aws lambda create-function \
  --function-name healthai-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/HealthAILambdaRole \
  --handler index.handler \
  --zip-file fileb://deployment.zip
\`\`\`

### 3. Setup API Gateway

\`\`\`bash
aws apigateway create-rest-api \
  --name HealthAI-API \
  --description "HealthAI API Gateway"
\`\`\`

### 4. Configure CloudFront CDN

\`\`\`bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
\`\`\`

## Docker Deployment

### 1. Build Docker Image
\`\`\`bash
docker build -t healthai:latest .
\`\`\`

### 2. Run Container
\`\`\`bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e AWS_ACCESS_KEY_ID=... \
  healthai:latest
\`\`\`

### 3. Push to ECR
\`\`\`bash
aws ecr create-repository --repository-name healthai

docker tag healthai:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/healthai:latest

docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/healthai:latest
\`\`\`

## Database Setup

### 1. Create Database
\`\`\`bash
createdb healthai
\`\`\`

### 2. Run Migrations
\`\`\`bash
npm run migrate
\`\`\`

### 3. Seed Data (Optional)
\`\`\`bash
npm run seed
\`\`\`

## Monitoring & Logging

### CloudWatch Setup
\`\`\`bash
# Create log group
aws logs create-log-group --log-group-name /aws/lambda/healthai

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name healthai-high-error-rate \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name ErrorCount \
  --threshold 5
\`\`\`

## Security Checklist

- [ ] Enable AWS WAF
- [ ] Configure security groups
- [ ] Enable encryption at rest (KMS)
- [ ] Enable encryption in transit (TLS)
- [ ] Setup MFA for AWS account
- [ ] Configure backup policies
- [ ] Setup audit logging
- [ ] Enable VPC Flow Logs
- [ ] Configure DDoS protection (AWS Shield)
- [ ] Regular security audits

## Performance Optimization

1. **Caching**: Enable CloudFront caching
2. **Database**: Add read replicas for scaling
3. **Lambda**: Increase memory allocation
4. **CDN**: Optimize asset delivery
5. **Monitoring**: Setup performance alerts

## Troubleshooting

### Common Issues

**Database Connection Error**
\`\`\`bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier healthai-db

# Verify security group
aws ec2 describe-security-groups
\`\`\`

**Lambda Timeout**
\`\`\`bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name healthai-api \
  --timeout 60
\`\`\`

**S3 Access Denied**
\`\`\`bash
# Check IAM permissions
aws iam get-role-policy --role-name HealthAILambdaRole --policy-name S3Access
\`\`\`

## Support

For deployment issues, contact: support@healthai.com

# 🏥 Vitalis - AI-Powered Health & Nutrition Companion

> **IEEE CSTAM2.0 Technical Challenge Submission**  
> Cloud-native, GenAI-powered health platform with real-time insights and personalized coaching

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-Ready-FF9900)](https://aws.amazon.com/)

## 🎯 Challenge Objectives Met

✅ **Cloud-native Architecture** - Serverless, scalable, containerized  
✅ **GenAI Integration** - Multi-model AI for health coaching & meal analysis  
✅ **Real-time Health Analysis** - Live metrics, predictions, recommendations  
✅ **Secure Data Processing** - GDPR/HIPAA compliant, encrypted storage  
✅ **Production Ready** - Enterprise security, monitoring, deployment ready  

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MySQL 8.0+
- Docker (optional)

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/vitalis-health-ai.git
cd vitalis-health-ai

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Setup database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### With Docker
```bash
# Start all services
docker-compose up -d

# Access application
open http://localhost:3000
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile App    │    │  Wearable Dev   │
│   (React/Next)  │    │   (Future)      │    │   (Future)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Next.js Application    │
                    │   (Vercel/AWS Lambda)     │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────┴────────┐    ┌──────────┴──────────┐    ┌────────┴────────┐
│   AI Services  │    │     Database        │    │   File Storage  │
│  (OpenRouter)  │    │ (MySQL/PostgreSQL)  │    │ (MinIO/AWS S3)  │
└────────────────┘    └─────────────────────┘    └─────────────────┘
```

## 🤖 AI Features

### **Intelligent Meal Analysis**
- Computer vision food identification
- Automatic nutrition calculation
- Personalized dietary recommendations
- Real-time calorie tracking

### **AI Health Coach**
- ChatGPT-style conversational interface
- Context-aware health advice
- Personalized fitness recommendations
- Progress tracking and motivation

### **Smart Training Plans**
- AI-generated workout routines
- Adaptive difficulty progression
- Goal-specific programming
- Real-time plan adjustments

## 🔐 Security & Compliance

### **Enterprise Security**
- JWT + HTTP-only cookie authentication
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- OWASP Top 10 protection
- Rate limiting & DDoS protection

### **Privacy Compliance**
- GDPR compliant data handling
- HIPAA-ready architecture
- Audit logging for all operations
- Data minimization principles
- Right to deletion support

## 📊 Technology Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **SWR** - Data fetching and caching

### **Backend**
- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Type-safe database access
- **MySQL** - Relational database
- **MinIO** - S3-compatible object storage
- **JWT** - Stateless authentication

### **AI Integration**
- **OpenRouter API** - Multi-model AI access
- **DeepSeek** - Primary AI model
- **Llama 3.2** - Fallback model
- **Gemini Flash** - Secondary option

### **DevOps & Cloud**
- **Docker** - Containerization
- **AWS Lambda** - Serverless deployment
- **AWS S3** - Production file storage
- **CloudFront** - Global CDN
- **Vercel** - Frontend deployment

## 🎨 Features Showcase

### **Health Dashboard**
- Real-time health metrics visualization
- Calorie tracking with dynamic goals
- Activity monitoring (steps, workouts)
- Progress charts and trends

### **Meal Tracker**
- Photo-based meal logging
- AI-powered nutrition analysis
- Macro and micronutrient breakdown
- Dietary goal tracking

### **AI Coach Chat**
- Personalized health conversations
- Context-aware recommendations
- Conversation history management
- Multi-turn dialogue support

### **Training Coach**
- Custom workout plan generation
- Exercise scheduling and tracking
- Progress monitoring
- Adaptive difficulty adjustment

### **Integrations**
- **Strava** - Fitness activity sync
- **Google Fitness** - Wearable data
- **Apple Health** - iOS health data
- **Fitbit** - Activity tracking

## 🚀 Deployment

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### **Production (AWS)**
```bash
# Deploy to Vercel
vercel --prod

# Or deploy to AWS Lambda
serverless deploy
```

### **Docker Production**
```bash
docker build -t vitalis-health-ai .
docker run -p 3000:3000 vitalis-health-ai
```

## 📈 Performance & Scalability

### **Performance Metrics**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### **Scalability Features**
- Serverless auto-scaling
- Database connection pooling
- CDN for global distribution
- Horizontal service scaling
- Load balancing ready

## 🏆 Competition Highlights

### **Innovation**
- Multi-model AI with intelligent fallbacks
- Real-time health data processing
- Personalized coaching algorithms
- Computer vision meal analysis

### **Technical Excellence**
- Enterprise-grade security architecture
- Cloud-native microservices design
- Comprehensive error handling
- Production-ready monitoring

### **Business Impact**
- Scalable SaaS business model
- Healthcare industry disruption potential
- Global market accessibility
- Startup incubation ready

## 📝 API Documentation

### **Authentication**
```typescript
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
```

### **Health Data**
```typescript
GET /api/v1/health/metrics
POST /api/v1/meals/analyze
GET /api/v1/meals
```

### **AI Services**
```typescript
POST /api/v1/coach/message
GET /api/v1/coach/conversations
POST /api/v1/training-plans
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎖️ IEEE CSTAM2.0 Submission

**Team**: [Your Team Name]  
**Category**: Cloud Computing & GenAI Health Innovation  
**Submission Date**: [Date]  

### **Deliverables**
- ✅ Cloud-integrated prototype
- ✅ Data collection & processing pipeline
- ✅ AI model integration
- ✅ Security & privacy implementation
- ✅ System architecture documentation
- ✅ Business plan & pitch deck

---

**Built with ❤️ for IEEE CSTAM2.0 Technical Challenge**

*Empowering healthier lives through AI-driven insights and personalized coaching.*
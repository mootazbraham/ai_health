# HealthAI Companion - API Documentation

## Overview
The HealthAI Companion backend provides RESTful APIs for meal analysis, health metrics tracking, AI coaching, and user authentication. All APIs are built with Next.js Route Handlers and integrate with OpenAI for AI-powered insights.

---

## Authentication APIs

### 1. User Registration
**Endpoint:** `POST /api/v1/auth/register`

**Purpose:** Create a new user account with email and password

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
\`\`\`

**Response (Success - 201):**
\`\`\`json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
\`\`\`

**What it does:**
- Validates email format and password strength
- Hashes password with salt for security
- Creates user record in database
- Returns JWT token for authentication

---

### 2. User Login
**Endpoint:** `POST /api/v1/auth/login`

**Purpose:** Authenticate user and get access token

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
\`\`\`

**Response (Success - 200):**
\`\`\`json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
\`\`\`

**What it does:**
- Verifies email exists in database
- Compares provided password with stored hash
- Generates JWT token valid for 24 hours
- Returns token for authenticated requests

---

## Meal Analysis APIs

### 3. Analyze Meal
**Endpoint:** `POST /api/v1/meals/analyze`

**Purpose:** Use AI to analyze a meal image and extract nutritional information

**Request Body:**
\`\`\`json
{
  "mealImage": "base64_encoded_image_or_url",
  "mealName": "Grilled Chicken Salad",
  "userPreferences": {
    "dietaryRestrictions": ["gluten-free"],
    "allergies": ["peanuts"]
  }
}
\`\`\`

**Response (Success - 200):**
\`\`\`json
{
  "success": true,
  "analysis": {
    "mealName": "Grilled Chicken Salad",
    "ingredients": [
      "Grilled Chicken Breast",
      "Mixed Greens",
      "Cherry Tomatoes",
      "Olive Oil Dressing"
    ],
    "nutritionalBreakdown": {
      "calories": 450,
      "protein": 35,
      "carbohydrates": 25,
      "fat": 12,
      "fiber": 5
    },
    "aiInsights": "Excellent choice! High in protein and low in calories. Great for muscle recovery and weight management.",
    "recommendations": [
      "Add more vegetables for additional fiber",
      "Consider whole grain bread on the side for complex carbs"
    ],
    "healthScore": 8.5
  }
}
\`\`\`

**What it does:**
- Sends meal image to OpenAI Vision API
- Identifies food items and portions
- Calculates nutritional values
- Generates personalized health insights
- Checks against user allergies/restrictions
- Stores analysis in user's meal history

---

## Health Metrics APIs

### 4. Get Health Metrics
**Endpoint:** `GET /api/v1/health/metrics`

**Purpose:** Retrieve user's current health metrics and daily progress

**Query Parameters:**
- `userId` (required): User ID
- `date` (optional): Specific date (YYYY-MM-DD), defaults to today
- `period` (optional): "day", "week", "month" - defaults to "day"

**Response (Success - 200):**
\`\`\`json
{
  "success": true,
  "metrics": {
    "date": "2025-10-21",
    "steps": 7234,
    "stepsGoal": 10000,
    "stepsPercentage": 72,
    "calories": 1850,
    "caloriesGoal": 2200,
    "caloriesPercentage": 84,
    "water": 6,
    "waterGoal": 8,
    "waterPercentage": 75,
    "sleep": 7.5,
    "sleepGoal": 8,
    "sleepPercentage": 94,
    "heartRate": 72,
    "heartRateNormal": "60-100",
    "bloodPressure": "120/80",
    "bloodPressureNormal": "120/80"
  },
  "insights": [
    "Great job! You're 72% towards your daily step goal.",
    "Your sleep pattern is excellent. Keep it up!",
    "Remember to drink more water. You're at 60% of daily goal."
  ]
}
\`\`\`

**What it does:**
- Fetches user's health data from database
- Calculates progress percentages
- Generates AI-powered insights
- Compares against health goals
- Returns status indicators (good/warning/critical)

---

### 5. Update Health Metrics
**Endpoint:** `POST /api/v1/health/metrics`

**Purpose:** Log new health data (steps, water intake, sleep, etc.)

**Request Body:**
\`\`\`json
{
  "userId": "user_123",
  "metrics": {
    "steps": 7234,
    "water": 6,
    "sleep": 7.5,
    "heartRate": 72,
    "bloodPressure": "120/80"
  }
}
\`\`\`

**Response (Success - 201):**
\`\`\`json
{
  "success": true,
  "message": "Metrics updated successfully",
  "updatedMetrics": {
    "date": "2025-10-21",
    "steps": 7234,
    "water": 6,
    "sleep": 7.5,
    "heartRate": 72,
    "bloodPressure": "120/80"
  }
}
\`\`\`

**What it does:**
- Validates metric values
- Stores data in encrypted database
- Updates user's daily progress
- Triggers AI analysis for anomalies
- Generates wellness alerts if needed

---

## AI Coach APIs

### 6. Get AI Health Coach Response
**Endpoint:** `POST /api/v1/coach/message`

**Purpose:** Chat with AI health coach for personalized wellness advice

**Request Body:**
\`\`\`json
{
  "userId": "user_123",
  "message": "I've been feeling tired lately, what should I do?",
  "context": {
    "recentMetrics": {
      "sleep": 6.5,
      "steps": 5000,
      "water": 4
    },
    "recentMeals": ["Salad", "Pasta", "Smoothie"]
  }
}
\`\`\`

**Response (Success - 200):**
\`\`\`json
{
  "success": true,
  "coach": {
    "message": "I notice your sleep has been lower than usual (6.5 hours vs your 8-hour goal). This could be contributing to your fatigue. Here are my recommendations:\n\n1. **Improve Sleep Quality**: Try going to bed 30 minutes earlier\n2. **Increase Water Intake**: You're only at 50% of your daily goal - dehydration causes fatigue\n3. **Add More Movement**: Light exercise can improve sleep quality\n4. **Nutrition**: Consider adding iron-rich foods like spinach or lean meat\n\nWould you like specific meal suggestions or a sleep improvement plan?",
    "recommendations": [
      "Increase sleep to 8 hours",
      "Drink 4 more glasses of water today",
      "Take a 20-minute walk",
      "Add iron-rich foods to meals"
    ],
    "actionItems": [
      {
        "action": "Sleep",
        "target": "8 hours",
        "current": "6.5 hours",
        "priority": "high"
      },
      {
        "action": "Water",
        "target": "8 glasses",
        "current": "4 glasses",
        "priority": "medium"
      }
    ]
  }
}
\`\`\`

**What it does:**
- Analyzes user's health context (metrics, meals, history)
- Sends conversation to OpenAI with system prompt
- Generates personalized health coaching
- Provides actionable recommendations
- Maintains conversation history for context
- Stores conversation for future reference

---

## Data Flow Diagram

\`\`\`
User Action → Frontend Component → API Endpoint → Validation → 
AI Processing (if needed) → Database Storage → Response → UI Update
\`\`\`

### Example: Meal Analysis Flow
\`\`\`
1. User takes photo of meal
   ↓
2. Frontend sends to /api/v1/meals/analyze
   ↓
3. API validates image and user data
   ↓
4. Image sent to OpenAI Vision API
   ↓
5. AI returns food identification & nutrition
   ↓
6. API stores in encrypted database
   ↓
7. Response sent to frontend with analysis
   ↓
8. UI displays meal breakdown and AI insights
\`\`\`

---

## Security Features

All APIs implement:
- **JWT Authentication**: Token-based access control
- **Input Validation**: Sanitizes all user inputs
- **Encryption**: AES-256 for sensitive data at rest
- **HTTPS/TLS**: Encrypted data in transit
- **Rate Limiting**: Prevents abuse (100 requests/hour per user)
- **CORS Protection**: Restricts cross-origin requests
- **SQL Injection Prevention**: Parameterized queries

---

## Error Responses

### 400 - Bad Request
\`\`\`json
{
  "success": false,
  "error": "Invalid email format",
  "code": "INVALID_INPUT"
}
\`\`\`

### 401 - Unauthorized
\`\`\`json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "UNAUTHORIZED"
}
\`\`\`

### 500 - Server Error
\`\`\`json
{
  "success": false,
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
\`\`\`

---

## Environment Variables Required

\`\`\`
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:3000
ENCRYPTION_KEY=your-32-char-encryption-key
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-jwt-secret-key
\`\`\`

---

## Rate Limiting

- **Authentication**: 5 requests per minute per IP
- **Meal Analysis**: 10 requests per hour per user
- **Health Metrics**: 100 requests per hour per user
- **AI Coach**: 20 requests per hour per user

---

## Testing the APIs

### Using cURL

**Register User:**
\`\`\`bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
\`\`\`

**Analyze Meal:**
\`\`\`bash
curl -X POST http://localhost:3000/api/v1/meals/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mealImage": "base64_image_data",
    "mealName": "Chicken Salad"
  }'
\`\`\`

**Get Health Metrics:**
\`\`\`bash
curl -X GET "http://localhost:3000/api/v1/health/metrics?userId=user_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

---

## Support & Troubleshooting

- **API not responding**: Check if server is running on port 3000
- **Authentication failed**: Verify JWT token is valid and not expired
- **Image analysis fails**: Ensure image is valid format (JPG, PNG) and under 5MB
- **Database errors**: Check DATABASE_URL environment variable

For more help, contact: support@healthai.com

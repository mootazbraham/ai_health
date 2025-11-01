# What Are These APIs? - Complete Beginner's Guide

## Simple Explanation

Think of APIs like a **restaurant menu**:
- You (the customer/frontend) look at the menu
- You order something (send a request to an API)
- The kitchen (backend) prepares your order
- You receive your food (get a response)

In our HealthAI app:
- **Frontend** = The app you see on your phone/computer
- **API** = The communication channel between frontend and backend
- **Backend** = The server that processes requests and stores data

---

## The 6 Main APIs Explained Simply

### 1. **Register API** - Create Your Account
\`\`\`
What it does: Creates a new user account
When you use it: First time opening the app
What you send: Email, password, name
What you get back: User ID, authentication token
\`\`\`

**Real-world example:**
- You click "Sign Up"
- Enter email: `john@example.com`
- Enter password: `MyPassword123`
- API creates account and gives you a token (like a key card)

---

### 2. **Login API** - Access Your Account
\`\`\`
What it does: Verifies your credentials and gives you access
When you use it: Every time you open the app
What you send: Email, password
What you get back: Authentication token (proves you're you)
\`\`\`

**Real-world example:**
- You click "Login"
- Enter email and password
- API checks if they match
- If correct, gives you a token to use the app
- If wrong, denies access

---

### 3. **Meal Analysis API** - AI Analyzes Your Food
\`\`\`
What it does: Uses AI to identify food and calculate nutrition
When you use it: When you take a photo of your meal
What you send: Photo of meal, meal name
What you get back: Calories, protein, carbs, fat, AI insights
\`\`\`

**Real-world example:**
\`\`\`
You: "Analyze this photo of my lunch"
     [sends photo of chicken salad]
     
API: "I see grilled chicken, lettuce, tomatoes, olive oil dressing
     Calories: 450
     Protein: 35g
     Carbs: 25g
     Fat: 12g
     
     Insight: Excellent choice! High protein, low calories."
\`\`\`

---

### 4. **Health Metrics API** - Track Your Daily Progress
\`\`\`
What it does: Stores and retrieves your health data
When you use it: Throughout the day as you log activities
What you send: Steps, water intake, sleep hours, heart rate
What you get back: Progress percentages, insights, status
\`\`\`

**Real-world example:**
\`\`\`
Morning:
- You log: 7,234 steps (72% of 10,000 goal)
- You log: 6 glasses of water (75% of 8 goal)
- You log: 7.5 hours sleep (94% of 8 goal)

API returns:
- Dashboard shows your progress
- Gives insights: "Great job on sleep! Drink more water."
\`\`\`

---

### 5. **Update Metrics API** - Save Your Health Data
\`\`\`
What it does: Saves new health measurements to database
When you use it: When you log new data
What you send: Steps, water, sleep, heart rate, blood pressure
What you get back: Confirmation that data was saved
\`\`\`

**Real-world example:**
\`\`\`
You: "I just walked 2,000 more steps"
API: "Saved! Your total is now 9,234 steps (92% of goal)"
\`\`\`

---

### 6. **AI Coach API** - Chat with Your Health Coach
\`\`\`
What it does: AI responds to your health questions
When you use it: When you want personalized advice
What you send: Your question + your health context
What you get back: Personalized recommendations
\`\`\`

**Real-world example:**
\`\`\`
You: "I've been feeling tired lately"

API analyzes:
- Your sleep: 6.5 hours (below 8-hour goal)
- Your water: 4 glasses (below 8-glass goal)
- Your steps: 5,000 (below 10,000 goal)

AI Coach responds:
"I notice your sleep is low. Try going to bed 30 minutes earlier.
Also, drink 4 more glasses of water - dehydration causes fatigue.
Take a 20-minute walk to improve sleep quality."
\`\`\`

---

## How They Work Together

### Complete User Journey:

\`\`\`
1. USER OPENS APP
   ↓
2. LOGIN API
   - Verifies email/password
   - Returns authentication token
   ↓
3. HEALTH METRICS API
   - Fetches today's progress
   - Shows dashboard
   ↓
4. USER TAKES MEAL PHOTO
   ↓
5. MEAL ANALYSIS API
   - Analyzes photo with AI
   - Returns nutrition info
   - Stores in database
   ↓
6. USER ASKS AI COACH
   ↓
7. AI COACH API
   - Reads user's health data
   - Generates personalized advice
   - Stores conversation
   ↓
8. USER SEES RECOMMENDATIONS
   - Meal suggestions
   - Exercise tips
   - Hydration reminders
\`\`\`

---

## What Each Environment Variable Does

### `OPENAI_API_KEY`
- **What it is**: Your key to use OpenAI's AI services
- **What it does**: Allows the app to use ChatGPT and Vision AI
- **Used by**: Meal Analysis API, AI Coach API
- **Example**: Analyzes meal photos, generates health advice
- **Where to get**: https://platform.openai.com/api/keys

### `NEXT_PUBLIC_API_URL`
- **What it is**: The address where your backend server runs
- **What it does**: Tells the frontend where to send requests
- **Used by**: All APIs
- **Example**: `http://localhost:3000` (local) or `https://myapp.vercel.app` (production)
- **Why "NEXT_PUBLIC"**: It's safe to show in frontend code

### `ENCRYPTION_KEY`
- **What it is**: A secret code to encrypt sensitive data
- **What it does**: Protects user passwords, health data, meal history
- **Used by**: All APIs when storing data
- **Example**: Encrypts passwords before saving to database
- **Why secret**: If someone gets this key, they can decrypt all data

---

## Data Security Flow

\`\`\`
User enters password
        ↓
Password + Encryption Key
        ↓
Encrypted (scrambled)
        ↓
Stored in database (unreadable)
        ↓
When user logs in:
        ↓
Database retrieves encrypted password
        ↓
Compares with new password + Encryption Key
        ↓
If match → Login successful
\`\`\`

---

## Common Questions

### Q: Why do I need an API?
**A:** Without APIs, your frontend and backend can't communicate. APIs are the "language" they use to talk to each other.

### Q: What if an API fails?
**A:** The app shows an error message. For example:
- "Failed to analyze meal - please try again"
- "Network error - check your internet"
- "Server is busy - try again later"

### Q: How fast are the APIs?
**A:** 
- Login: < 100ms
- Get metrics: < 200ms
- Meal analysis: 2-5 seconds (AI processing)
- AI Coach: 3-8 seconds (AI thinking)

### Q: Can I use these APIs from my phone?
**A:** Yes! The frontend (React app) runs on your phone and sends requests to the backend APIs.

### Q: What if I forget my password?
**A:** The API would need a "Password Reset" endpoint (not yet implemented) that:
1. Verifies your email
2. Sends reset link
3. Lets you create new password

---

## Next Steps

1. **Set up environment variables** (OPENAI_API_KEY, etc.)
2. **Test the APIs** using the cURL commands in API_DOCUMENTATION.md
3. **Build the frontend** to use these APIs
4. **Deploy to production** (AWS, Vercel, etc.)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API not found" | Check NEXT_PUBLIC_API_URL is correct |
| "Invalid token" | Login again to get new token |
| "Meal analysis failed" | Check image is valid (JPG/PNG, < 5MB) |
| "Database error" | Check DATABASE_URL environment variable |
| "OpenAI error" | Check OPENAI_API_KEY is valid |

---

## Summary

- **APIs** = Communication between frontend and backend
- **6 APIs** = Register, Login, Analyze Meal, Get Metrics, Update Metrics, AI Coach
- **Environment variables** = Secret keys that make APIs work
- **Security** = Encryption protects user data
- **Speed** = Most APIs respond in < 1 second

You now understand what these APIs do! 🎉

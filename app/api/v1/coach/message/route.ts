  import { type NextRequest, NextResponse } from "next/server"

  export async function POST(request: NextRequest) {
    try {
      const body = await request.json()
      const { userId, message, userHealth } = body

      if (!userId || !message) {
        return NextResponse.json({ error: "Missing userId or message" }, { status: 400 })
      }

      // Build system prompt with user context
      const systemPrompt = `You are a certified health coach and nutritionist. 
  You have access to the user's health data: ${JSON.stringify(userHealth || {})}.
  Provide personalized, evidence-based health advice.
  Be encouraging but honest about health recommendations.
  Keep responses concise (2-3 sentences).`

      // Call OpenAI API for coaching response
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3.1:free", // ✅ safer lightweight model name
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      const data = await response.json()

      // ✅ Handle failed API responses gracefully
      if (!response.ok) {
        console.error("Open Router API error:", data)
        return NextResponse.json(
          { error: "OpenAI API request failed", details: data },
          { status: 500 }
        )
      }

      const coachMessage =
        data.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a response."

      // Store conversation (simulated)
      const conversation = {
        id: Date.now().toString(),
        userId,
        userMessage: message,
        coachMessage,
        timestamp: new Date().toISOString(),
      }

      console.log("[v0] Coach message generated:", conversation)

      return NextResponse.json({
        success: true,
        conversation,
      })
    } catch (error) {
      console.error("[v0] Coach message error:", error)
      return NextResponse.json(
        { error: "Failed to generate coach message", details: error },
        { status: 500 }
      )
    }
  }

"use client"

import { useState } from "react"
import CoachMessage from "./coach-message"

interface Message {
  id: string
  type: "user" | "coach"
  content: string
  timestamp: Date
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "coach",
      content:
        "Hello! I'm your AI Health Coach. I'm here to help you achieve your wellness goals. What would you like to work on today?",
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/v1/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          message: input,
          userHealth: {},
        }),
      })

      const data = await response.json()

      if (data.success) {
        const coachMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "coach",
          content: data.conversation.coachMessage,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, coachMessage])
      }
    } catch (error) {
      console.log("[v0] Coach API error:", error)
      // Fallback response
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "coach",
        content: "I'm having trouble connecting to the AI service. Please try again in a moment.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, coachMessage])
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Coach Info */}
      <div
        className="rounded-xl p-6 border-2"
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent-teal-light) 0%, var(--color-accent-purple-light) 100%)",
          borderColor: "var(--color-accent-teal)",
        }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">Your AI Health Coach</h2>
        <p className="text-muted">Get personalized fitness and nutrition guidance powered by advanced AI</p>
      </div>

      {/* Chat Container */}
      <div
        className="rounded-xl overflow-hidden flex flex-col h-96 border"
        style={{
          backgroundColor: "var(--color-card-bg)",
          borderColor: "var(--color-neutral-200)",
        }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <CoachMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex gap-2 items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="p-4 flex gap-2 border-t"
          style={{
            borderTopColor: "var(--color-neutral-200)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask your health coach..."
            className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 border"
            style={{
              borderColor: "var(--color-neutral-200)",
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 transition-all duration-200"
            style={{
              backgroundColor: "var(--color-primary)",
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Send
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          className="rounded-xl p-4 text-left transition-all duration-200 border-2"
          style={{
            backgroundColor: "var(--color-accent-teal-light)",
            borderColor: "var(--color-accent-teal)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent-teal)"
          }}
        >
          <p className="font-semibold text-foreground mb-1">💪 Fitness Plan</p>
          <p className="text-sm text-muted">Get a personalized workout routine</p>
        </button>
        <button
          className="rounded-xl p-4 text-left transition-all duration-200 border-2"
          style={{
            backgroundColor: "var(--color-accent-purple-light)",
            borderColor: "var(--color-accent-purple)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent-purple)"
          }}
        >
          <p className="font-semibold text-foreground mb-1">🥗 Meal Plan</p>
          <p className="text-sm text-muted">Receive customized nutrition guidance</p>
        </button>
        <button
          className="rounded-xl p-4 text-left transition-all duration-200 border-2"
          style={{
            backgroundColor: "var(--color-success-light)",
            borderColor: "var(--color-success)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-success)"
          }}
        >
          <p className="font-semibold text-foreground mb-1">😴 Sleep Tips</p>
          <p className="text-sm text-muted">Improve your sleep quality</p>
        </button>
        <button
          className="rounded-xl p-4 text-left transition-all duration-200 border-2"
          style={{
            backgroundColor: "var(--color-warning-light)",
            borderColor: "var(--color-warning)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-warning)"
          }}
        >
          <p className="font-semibold text-foreground mb-1">🎯 Goal Tracking</p>
          <p className="text-sm text-muted">Monitor your progress</p>
        </button>
      </div>
    </div>
  )
}

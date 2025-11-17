"use client"

import { useState, useRef, useEffect } from "react"
import CoachMessage from "./coach-message"
import { useAuth } from "@/hooks/use-auth"
import { useMetrics } from "@/hooks/use-metrics"

interface ConversationItemProps {
  conversation: any
  isActive: boolean
  onSelect: () => void
  onRename: (newTitle: string) => void
  onDelete: () => void
}

function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(conversation.title)
  const [showMenu, setShowMenu] = useState(false)

  const handleRename = () => {
    onRename(title)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Delete this conversation?')) {
      onDelete()
    }
  }

  return (
    <div
      className={`group relative p-3 rounded-xl cursor-pointer transition-colors ${
        isActive ? 'bg-blue-100 border border-blue-200' : 'hover:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      {isEditing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleRename}
          onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          className="w-full bg-transparent border-none outline-none font-medium text-gray-800"
          autoFocus
        />
      ) : (
        <div className="font-medium text-gray-800 truncate pr-8">{conversation.title}</div>
      )}
      <div className="text-xs text-gray-500 mt-1">
        {new Date(conversation.updatedAt).toLocaleDateString()}
      </div>
      
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          ⋯
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false) }}
              className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
            >
              Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); setShowMenu(false) }}
              className="block w-full px-3 py-1 text-left text-sm text-red-600 hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface Message {
  id: string
  type: "user" | "coach"
  content: string
  timestamp: Date
}

export default function AICoach() {
  const { user, getAuthHeaders, isAuthenticated } = useAuth()
  const { summary } = useMetrics(user?.id)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Conversations
  const loadConversations = async () => {
    try {
      const res = await fetch(`/api/v1/coach/conversations?userId=${user?.id}`, { headers: { ...getAuthHeaders() } })
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations)
        if (!activeId && data.conversations.length) setActiveId(data.conversations[0].id)
      }
    } catch {}
  }

  const loadMessages = async (convId: number) => {
    try {
      const res = await fetch(`/api/v1/coach/conversations/${convId}/messages`, { headers: { ...getAuthHeaders() } })
      const data = await res.json()
      if (data.success) {
        setMessages(
          data.messages.map((m: any) => ({
            id: String(m.id),
            type: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
        )
      }
    } catch {}
  }

  const createConversation = async (): Promise<number | null> => {
    try {
      const res = await fetch("/api/v1/coach/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ title: "New chat", userId: user?.id }),
      })
      const data = await res.json()
      if (data.success) {
        setConversations((prev) => [data.conversation, ...prev])
        setActiveId(data.conversation.id)
        setMessages([])
        return data.conversation.id as number
      }
    } catch {}
    return null
  }

  const updateConversationTitle = async (convId: number, newTitle: string) => {
    try {
      const res = await fetch(`/api/v1/coach/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ title: newTitle }),
      })
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === convId ? {...c, title: newTitle} : c))
      }
    } catch {}
  }

  const deleteConversation = async (convId: number) => {
    try {
      const res = await fetch(`/api/v1/coach/conversations/${convId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId))
        if (activeId === convId) {
          setActiveId(null)
          setMessages([])
        }
      }
    } catch {}
  }

  const generateTitle = (message: string) => {
    return message.length > 30 ? message.substring(0, 30) + '...' : message
  }

  useEffect(() => {
    if (isAuthenticated) loadConversations()
  }, [isAuthenticated])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    const contentToSend = input
    setInput("")

    try {
      if (!isAuthenticated || !user) {
        setError("Please log in to use AI Coach")
        return
      }

      // Use real health metrics summary for personalization
      const userHealth = summary || {}

      // Ensure there's an active conversation
      let convId = activeId
      if (!convId) {
        convId = await createConversation()
      }
      if (!convId) throw new Error("Could not create conversation")

      // Persist user message
      await fetch(`/api/v1/coach/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ role: "user", content: contentToSend }),
      })

      // Update UI optimistically
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "user", content: contentToSend, timestamp: new Date() },
      ])
      scrollToBottom()

      // Get coach reply
      const response = await fetch("/api/v1/coach/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: contentToSend,
          userId: user.id,
          userHealth,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get coach response")
      }

      if (data.success && data.conversation) {
        const coachText = data.conversation.coachMessage || data.conversation.coachResponse || "I'm here to help!"
        // Persist coach message
        await fetch(`/api/v1/coach/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ role: "coach", content: coachText }),
        })
        
        // Auto-generate title from first message
        const conversation = conversations.find(c => c.id === convId)
        if (conversation && conversation.title === "New chat") {
          const newTitle = generateTitle(contentToSend)
          updateConversationTitle(convId, newTitle)
        }
        
        // Reload messages from server to keep consistent
        await loadMessages(convId)
        setError(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to AI service"
      setError(errorMessage)
      console.error("[AICoach] Error:", err)
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "coach",
        content: `I'm having trouble: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, coachMessage])
    }

    setIsLoading(false)
  }

  return (
    <div className="flex h-screen bg-gray-50 -mx-4 -my-6">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button 
            onClick={createConversation}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 px-4 font-semibold transition-colors"
          >
            + New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeId === conv.id}
              onSelect={() => setActiveId(conv.id)}
              onRename={(newTitle) => updateConversationTitle(conv.id, newTitle)}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">AI Fitness Coach</h2>
              <p className="text-sm text-gray-500">Your personal health assistant</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💪</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to start your fitness journey?</h3>
                <p className="text-gray-500">Ask me anything about workouts, nutrition, or health goals!</p>
              </div>
            )}
            
            {messages.map((message, idx) => (
              <div key={message.id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <CoachMessage message={message} />
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                placeholder="Ask your AI coach anything..."
                className="flex-1 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}

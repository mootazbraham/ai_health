"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"

interface Message {
  id: number
  role: 'user' | 'coach'
  content: string
  createdAt: string
}

interface Conversation {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export default function ChatInterface() {
  const { getAuthHeaders } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/v1/coach/conversations', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/v1/coach/conversations/${conversationId}/messages`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/v1/coach/conversations', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Chat' })
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation.id)
        setMessages([])
        loadConversations()
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch('/api/v1/coach/message', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversation
        })
      })

      if (response.ok) {
        const data = await response.json()
        const coachMessage: Message = {
          id: Date.now() + 1,
          role: 'coach',
          content: data.response,
          createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, coachMessage])
        
        if (data.conversationId && !currentConversation) {
          setCurrentConversation(data.conversationId)
          loadConversations()
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectConversation = (conversationId: number) => {
    setCurrentConversation(conversationId)
    loadMessages(conversationId)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={createNewConversation}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            + New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`p-3 rounded-xl cursor-pointer transition-colors ${
                currentConversation === conv.id 
                  ? 'bg-orange-100 border border-orange-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-gray-800 truncate">{conv.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">AI Fitness Coach</h2>
              <p className="text-sm text-gray-500">Your personal health assistant</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">💪</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to start your fitness journey?</h3>
              <p className="text-gray-500">Ask me anything about workouts, nutrition, or health goals!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-orange-100' : 'text-gray-400'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
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
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask your AI coach anything..."
              className="flex-1 rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
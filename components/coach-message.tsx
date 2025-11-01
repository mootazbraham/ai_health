interface Message {
  id: string
  type: "user" | "coach"
  content: string
  timestamp: Date
}

interface CoachMessageProps {
  message: Message
}

export default function CoachMessage({ message }: CoachMessageProps) {
  const isUser = message.type === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">🤖</span>
        </div>
      )}

      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isUser ? "bg-accent text-white rounded-br-none" : "bg-muted-light text-foreground rounded-bl-none"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-muted"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">👤</span>
        </div>
      )}
    </div>
  )
}

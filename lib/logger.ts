/**
 * Logging utility
 * Centralized logging with different log levels
 */

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  endpoint?: string
}

class Logger {
  private logToConsole(entry: LogEntry) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`
    
    if (entry.endpoint) {
      console.log(`${prefix} [${entry.endpoint}]`, entry.message, entry.data || "")
    } else {
      console.log(prefix, entry.message, entry.data || "")
    }
  }

  info(message: string, data?: any, context?: { userId?: string; endpoint?: string }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      data,
      ...context,
    }
    
    this.logToConsole(entry)
  }

  warn(message: string, data?: any, context?: { userId?: string; endpoint?: string }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      data,
      ...context,
    }
    
    this.logToConsole(entry)
  }

  error(message: string, error?: any, context?: { userId?: string; endpoint?: string }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      data: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
      ...context,
    }
    
    this.logToConsole(entry)
    
    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      // Integration with Sentry or similar service
    }
  }

  debug(message: string, data?: any, context?: { userId?: string; endpoint?: string }) {
    if (process.env.NODE_ENV === "development") {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        data,
        ...context,
      }
      
      this.logToConsole(entry)
    }
  }
}

export const logger = new Logger()



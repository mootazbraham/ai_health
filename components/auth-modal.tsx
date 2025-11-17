"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  onLogin?: (email: string, password: string) => void
}

export default function AuthModal({ onLogin }: AuthModalProps) {
  const { login, register } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      let result
      if (isSignUp) {
        // Register new user
        result = await register(email, password, name)
      } else {
        // Login existing user
        result = await login(email, password)
      }

      if (result.success) {
        // Legacy callback support
        if (onLogin) {
          onLogin(email, password)
        }
        // Refresh page to update auth state
        router.refresh()
        window.location.reload()
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden"
      suppressHydrationWarning
    >
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden" suppressHydrationWarning>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-[500px] relative z-10 animate-scale-in flex flex-col" suppressHydrationWarning>
        {/* Logo Section */}
        <div className="text-center mb-6 flex-shrink-0" suppressHydrationWarning>
          <img src="/vitalis-logo.svg" alt="Vitalis" className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Vitalis
          </h1>
          <p className="text-gray-700 font-medium text-sm md:text-base">Your Personal Health Companion</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20 w-full flex-shrink-0" suppressHydrationWarning>
          <div className="mb-5" suppressHydrationWarning>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-600 text-sm">
              {isSignUp ? "Start your health journey today" : "Sign in to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="animate-slide-up" suppressHydrationWarning>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
              </div>
            )}

            <div suppressHydrationWarning>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                required
              />
            </div>

            <div suppressHydrationWarning>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </span>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </button>
          </form>

          <div className="mt-5 text-center" suppressHydrationWarning>
            <p className="text-xs md:text-sm text-gray-700">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border-2 border-red-200" suppressHydrationWarning>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

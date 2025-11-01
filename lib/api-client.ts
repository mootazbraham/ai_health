const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  headers?: Record<string, string>
  token?: string
}

export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = "GET", body, headers = {}, token } = options

  const url = `${API_BASE_URL}${endpoint}`

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  }

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "API request failed")
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] API call error:", error)
    throw error
  }
}

// Specific API methods
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiCall("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (email: string, password: string, name: string) =>
    apiCall("/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),

  // Meals
  analyzeMeal: (file: File, userId: string) => {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("userId", userId)

    return fetch(`${API_BASE_URL}/meals/analyze`, {
      method: "POST",
      body: formData,
    }).then((res) => res.json())
  },

  // Health Metrics
  getMetrics: (userId: string, type?: string) => {
    const params = new URLSearchParams({ userId })
    if (type) params.append("type", type)
    return apiCall(`/health/metrics?${params}`)
  },

  logMetric: (userId: string, type: string, value: number, unit: string) =>
    apiCall("/health/metrics", {
      method: "POST",
      body: { userId, type, value, unit },
    }),

  // Coach
  sendCoachMessage: (userId: string, message: string, userHealth?: any) =>
    apiCall("/coach/message", {
      method: "POST",
      body: { userId, message, userHealth },
    }),
}

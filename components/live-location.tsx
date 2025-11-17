"use client"

import { useState, useEffect } from "react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface StravaLocationProps {
  athleteData?: {
    city?: string
    state?: string
    country?: string
    profile?: string
  }
}

export default function LiveLocation({ athleteData }: StravaLocationProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
        setLoading(false)
      },
      (error) => {
        setError(error.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <h3 className="text-lg font-bold">Your Location</h3>
        </div>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "📡" : "🔄"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {location && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">LATITUDE</p>
              <p className="font-mono text-sm">{location.latitude.toFixed(6)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">LONGITUDE</p>
              <p className="font-mono text-sm">{location.longitude.toFixed(6)}</p>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Accuracy: ±{Math.round(location.accuracy)}m</p>
            <p className="text-xs text-gray-500">
              Updated: {new Date(location.timestamp).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm text-center hover:bg-red-600"
            >
              🗺️ Google Maps
            </a>
            <a
              href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm text-center hover:bg-green-600"
            >
              🌍 OpenStreetMap
            </a>
          </div>
        </div>
      )}

      {athleteData && (athleteData.city || athleteData.country) && (
        <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏃‍♂️</span>
            <p className="font-medium text-orange-800">From Strava Profile</p>
          </div>
          <p className="text-orange-700">
            {[athleteData.city, athleteData.state, athleteData.country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {!location && !error && !loading && (
        <div className="text-center py-4 text-gray-500">
          <span className="text-3xl block mb-2">🌍</span>
          <p>Click refresh for precise GPS location</p>
        </div>
      )}
    </div>
  )
}
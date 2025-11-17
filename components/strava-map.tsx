"use client"

interface StravaMapProps {
  gpsData: Array<{
    id: number
    name: string
    startLat?: number
    startLng?: number
    endLat?: number
    endLng?: number
    polyline?: string
  }>
  athleteData?: {
    city?: string
    state?: string
    country?: string
  }
}

export default function StravaMap({ gpsData, athleteData }: StravaMapProps) {
  const latestActivity = gpsData.find(activity => activity.startLat && activity.startLng)
  
  if (!latestActivity) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🗺️</span>
          <h3 className="text-lg font-bold">Activity Map</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">📍</span>
          <p>No GPS activities found</p>
          <p className="text-sm">Complete a workout with GPS to see your route</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🗺️</span>
        <h3 className="text-lg font-bold">Live Activity Map</h3>
      </div>
      
      <div className="mb-4">
        <iframe
          width="100%"
          height="300"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${latestActivity.startLng! - 0.01},${latestActivity.startLat! - 0.01},${latestActivity.startLng! + 0.01},${latestActivity.startLat! + 0.01}&layer=mapnik&marker=${latestActivity.startLat},${latestActivity.startLng}`}
          className="rounded-lg"
        />
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-orange-50 rounded-lg">
          <p className="font-medium text-orange-800">📍 {latestActivity.name}</p>
          <p className="text-sm text-orange-600">
            {latestActivity.startLat?.toFixed(6)}, {latestActivity.startLng?.toFixed(6)}
          </p>
        </div>
        
        {athleteData && (athleteData.city || athleteData.country) && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-800">🏠 Home Base</p>
            <p className="text-sm text-blue-600">
              {[athleteData.city, athleteData.state, athleteData.country].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://www.google.com/maps?q=${latestActivity.startLat},${latestActivity.startLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm text-center hover:bg-red-600"
          >
            📱 Google Maps
          </a>
          <a
            href={`https://www.strava.com/activities/${latestActivity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm text-center hover:bg-orange-600"
          >
            🏃 View on Strava
          </a>
        </div>
      </div>
    </div>
  )
}
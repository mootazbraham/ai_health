"use client"

interface ActivityMapProps {
  gpsData: Array<{
    id: number
    name: string
    startLat?: number
    startLng?: number
    endLat?: number
    endLng?: number
    city?: string
    country?: string
  }>
}

export default function ActivityMap({ gpsData }: ActivityMapProps) {
  if (!gpsData || gpsData.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 text-center">
        <span className="text-4xl mb-2 block">🗺️</span>
        <p className="text-gray-600">No GPS data available</p>
        <p className="text-sm text-gray-500">Complete activities with GPS to see your routes</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📍</span>
        <h3 className="text-lg font-bold">Activity Locations</h3>
      </div>
      
      <div className="space-y-3">
        {gpsData.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">{activity.name}</p>
              <p className="text-sm text-gray-600">
                {activity.city && activity.country 
                  ? `${activity.city}, ${activity.country}`
                  : `${activity.startLat?.toFixed(4)}, ${activity.startLng?.toFixed(4)}`
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Start</p>
              <p className="text-sm font-mono">
                {activity.startLat?.toFixed(4)}, {activity.startLng?.toFixed(4)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> GPS coordinates can be used with mapping services to view your exact routes!
        </p>
      </div>
    </div>
  )
}
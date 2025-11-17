"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"

export default function StravaSync({ onSync }: { onSync?: () => void }) {
  const { getAuthHeaders } = useAuth()
  const { t } = useLanguage()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('strava_connected') === 'true') {
      setIsConnected(true)
      setStatus('Connected!')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const connectStrava = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/v1/auth/strava/connect', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Strava connect error:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const syncData = async () => {
    setIsSyncing(true)
    setStatus('Syncing...')
    try {
      const response = await fetch('/api/v1/strava/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setStatus(`Synced: ${data.data.steps} steps, ${data.data.calories} cal`)
        onSync?.()
      } else {
        setStatus(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      setStatus('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Button 
          onClick={connectStrava} 
          disabled={isConnecting} 
          className="bg-orange-500 hover:bg-orange-600 text-white border-0 px-6 py-3 rounded-xl font-semibold shadow-lg"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Connecting...
            </>
          ) : (
            <>
              {t('Connect Strava')}
            </>
          )}
        </Button>
        <Button 
          onClick={syncData} 
          disabled={isSyncing}
          className="bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-50 px-6 py-3 rounded-xl font-semibold shadow-lg"
        >
          {isSyncing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2" />
              Syncing...
            </>
          ) : (
            <>
              {t('Sync Data')}
            </>
          )}
        </Button>
      </div>
      {status && (
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="text-sm text-white font-medium">{status}</span>
        </div>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function GoogleFitnessSync({ onSync }: { onSync?: () => void }) {
  const { user, getAuthHeaders } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')

  useEffect(() => {
    // Check URL params for connection status
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_connected') === 'true') {
      setIsConnected(true)
      setSyncStatus('Connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const connectGoogle = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/v1/auth/google/connect', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Connect error:', error)
      setSyncStatus('Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const syncData = async () => {
    setIsSyncing(true)
    setSyncStatus('Syncing...')
    try {
      const response = await fetch('/api/v1/fitness/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setSyncStatus(`Synced: ${data.data.steps} steps, ${data.data.heartRate} bpm`)
        onSync?.()
      } else {
        setSyncStatus(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={connectGoogle}
          disabled={isConnecting}
          variant={isConnected ? "outline" : "default"}
          size="sm"
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Reconnect Google Fit' : 'Connect Google Fit'}
        </Button>
        
        <Button
          onClick={syncData}
          disabled={isSyncing || !user}
          variant="secondary"
          size="sm"
        >
          {isSyncing ? 'Syncing...' : 'Sync Data'}
        </Button>
        
        {isConnected && <Badge variant="secondary">Connected</Badge>}
      </div>
      
      {syncStatus && (
        <p className="text-sm text-muted-foreground">{syncStatus}</p>
      )}
    </div>
  )
}
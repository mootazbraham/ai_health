"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/header"
import NavigationTabs from "@/components/navigation-tabs"

export default function SettingsPage() {
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    units: 'metric',
    privacy: 'public',
    dataSharing: false,
    autoSync: true,
    language: 'en'
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        alert('Settings saved successfully!')
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />
      <NavigationTabs />
      <main className="flex-1 p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🔔 Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Push Notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Email Updates</span>
              <input
                type="checkbox"
                checked={settings.emailUpdates}
                onChange={(e) => setSettings({...settings, emailUpdates: e.target.checked})}
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🎨 Appearance</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Language</span>
              <select
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="border rounded px-3 py-1"
              >
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇲🇦 العربية</option>
              </select>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🔒 Privacy & Data</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Profile Visibility</span>
              <select
                value={settings.privacy}
                onChange={(e) => setSettings({...settings, privacy: e.target.value})}
                className="border rounded px-3 py-1"
              >
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span>Auto-sync with Strava</span>
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </main>
    </div>
  )
}
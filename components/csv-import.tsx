"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export default function CsvImport({ onSync }: { onSync?: () => void }) {
  const { getAuthHeaders } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/v1/health/import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      })
      
      if (response.ok) {
        onSync?.()
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">📊 Import CSV Data</h3>
      <div className="space-y-3">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500">
          Export data from Kieselect app and upload CSV file
        </p>
      </div>
    </Card>
  )
}
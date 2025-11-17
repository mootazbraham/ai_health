"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/header"
import NavigationTabs from "@/components/navigation-tabs"

export default function ProfilePage() {
  const { isAuthenticated, getAuthHeaders, logout, refreshUser } = useAuth()
  const [form, setForm] = useState<any>({})
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    fetch("/api/v1/profile", { headers: { ...getAuthHeaders() }})
      .then(res => res.json())
      .then(data => data.success && setForm(data.user))
      .catch(()=>{})
  }, [isAuthenticated])

  const save = async () => {
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type":"application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: form.name,
          age: form.age ? parseInt(form.age) : null,
          heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
          gender: form.gender,
          photoUrl: form.photoUrl
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert("Profile updated successfully!")
        window.location.reload()
      } else {
        alert("Failed to update profile")
      }
    } catch (error) {
      console.error('Save error:', error)
      alert("Error saving profile")
    }
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("photo", file)
      const res = await fetch("/api/v1/profile/photo", {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: fd,
      })
      const data = await res.json()
      if (data.success) {
        setForm((prev: any) => ({ ...prev, photoUrl: data.photoUrl }))
        alert("Photo uploaded successfully!")
        // Refresh user data in auth context
        await refreshUser()
      } else {
        alert("Failed to upload photo")
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />
      <NavigationTabs />
      <main className="flex-1 p-6 max-w-2xl mx-auto space-y-4" suppressHydrationWarning>
        <h1 className="text-2xl font-bold">Profile</h1>
      <div className="flex items-center gap-4" suppressHydrationWarning>
        <img src={form.photoUrl || "/placeholder-user.jpg"} alt="Profile" className="w-16 h-16 rounded-full object-cover border" onError={(e)=>{(e.target as HTMLImageElement).src='/placeholder-user.jpg'}} />
        <label className="px-3 py-2 bg-gray-100 rounded border cursor-pointer">
          {uploading ? "Uploading..." : "Change Photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
        <input className="border p-2 rounded" placeholder="Name" value={form.name || ""} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Email" value={form.email || ""} onChange={e=>setForm({...form, email:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Photo URL" value={form.photoUrl || ""} onChange={e=>setForm({...form, photoUrl:e.target.value})}/>
        <select className="border p-2 rounded" value={form.gender || ""} onChange={e=>setForm({...form, gender:e.target.value})}>
          <option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
        </select>
        <input className="border p-2 rounded" placeholder="Age" type="number" value={form.age || ""} onChange={e=>setForm({...form, age:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Height (cm)" type="number" step="0.1" value={form.heightCm || ""} onChange={e=>setForm({...form, heightCm:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Weight (kg)" type="number" step="0.1" value={form.weightKg || ""} onChange={e=>setForm({...form, weightKg:e.target.value})}/>
        <select className="border p-2 rounded" value={form.locale || "en"} onChange={e=>setForm({...form, locale:e.target.value})}>
          <option value="en">🇬🇧 English</option><option value="fr">🇫🇷 Français</option><option value="ar">🇲🇦 العربية</option>
        </select>
      </div>
      <div className="flex gap-3" suppressHydrationWarning>
        <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        <button onClick={() => { logout(); if (typeof window !== 'undefined') window.location.href = '/' }} className="px-4 py-2 bg-gray-200 rounded">Sign out</button>
      </div>
      </main>
    </div>
  )
}



"use client"

import { useRouter, usePathname } from "next/navigation"

export default function NavigationTabs() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { id: "dashboard", label: "Dashboard", path: "/" },
    { id: "meals", label: "Meal Tracker", path: "/meals" },
    { id: "coach", label: "AI Coach", path: "/coach" }
  ]

  const getActiveTab = () => {
    if (pathname === "/") return "dashboard"
    if (pathname.includes("/meals")) return "meals"
    if (pathname.includes("/coach")) return "coach"
    return "dashboard"
  }

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-[73px] z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                getActiveTab() === tab.id
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {getActiveTab() === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
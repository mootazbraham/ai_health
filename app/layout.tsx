import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import LanguageProvider from "@/components/language-provider"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vitalis - Your Personal Health Companion",
  description: "AI-powered health and nutrition guidance powered by cloud infrastructure",
  generator: 'v0.app',
  icons: {
    icon: "/vitalis-logo.svg",
    shortcut: "/vitalis-logo.svg",
    apple: "/vitalis-logo.svg",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.className} bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-foreground min-h-screen w-full overflow-x-hidden min-w-0`}
        suppressHydrationWarning={true}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

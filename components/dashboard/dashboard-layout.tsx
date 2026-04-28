"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumb: string
}

export function DashboardLayout({ children, title, breadcrumb }: DashboardLayoutProps) {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("alwaha_auth_token")
    if (!token) {
      router.push("/login")
    } else {
      setIsVerifying(false)
    }
  }, [router])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-waha-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="mr-48">
        {/* Top Bar */}
        <DashboardTopbar title={title} breadcrumb={breadcrumb} />

        {/* Content Area */}
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  PlayCircle,
  Users,
  FileText,
  LogOut,
  Shield,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

const navItems = [
  { icon: Home, label: "الرئيسية", href: "/" },
  { icon: Calendar, label: "الحجوزات", href: "/reservations" },
  { icon: PlayCircle, label: "تنفيذ العمليات", href: "/execute" },
  { icon: Users, label: "العملاء", href: "/customers" },
  { icon: FileText, label: "التقارير", href: "/reports" },
]

const adminItems = [
  { icon: Shield, label: "إدارة المستخدمين", href: "/admin/users" },
  { icon: Settings, label: "إعدادات الأجهزة", href: "/admin/hardware" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      localStorage.removeItem("alwaha_auth_token")
      localStorage.removeItem("alwaha_user")
      toast.success("تم تسجيل الخروج بنجاح")
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
      localStorage.removeItem("alwaha_auth_token")
      localStorage.removeItem("alwaha_user")
      router.push("/login")
    }
  }

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-48 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl border-l border-sidebar-border">
      {/* Logo Section */}
      <div className="flex justify-center items-center px-4 py-6 mb-2">
        <img src="/logo.png" alt="Alwaha Bank Logo" className="w-28 h-auto object-contain drop-shadow-md" />
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 space-y-4 mt-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 px-3 mb-2 font-bold">القائمة الرئيسية</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 text-xs relative overflow-hidden",
                      isActive
                        ? "bg-waha-gray-800 text-white font-semibold shadow-inner"
                        : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-waha-gold rounded-l-full" />
                    )}
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors duration-300",
                      isActive ? "text-waha-gold" : "group-hover:text-waha-gold"
                    )} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 px-3 mb-2 font-bold">الإدارة والنظام</p>
          <ul className="space-y-1">
            {adminItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 text-xs relative overflow-hidden",
                      isActive
                        ? "bg-waha-gray-800 text-white font-semibold shadow-inner"
                        : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-waha-gold rounded-l-full" />
                    )}
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors duration-300",
                      isActive ? "text-waha-gold" : "group-hover:text-waha-gold"
                    )} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* User / Logout Section */}
      <div className="px-3 py-3 mt-auto border-t border-sidebar-border bg-black/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-300 text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}


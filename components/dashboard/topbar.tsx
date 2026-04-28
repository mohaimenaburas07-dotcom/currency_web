"use client"

import { Bell, Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface TopbarProps {
  title: string
  breadcrumb?: string
}

export function DashboardTopbar({ title, breadcrumb }: TopbarProps) {
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
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-1.5">
        {/* Breadcrumb Section */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{breadcrumb || "نظرة عامة"}</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{title}</span>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="بحث"
              className="w-48 pr-8 h-8 bg-muted/40 border-0 rounded-lg text-[11px] focus-visible:ring-1 focus-visible:ring-waha-gold/50"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg hover:bg-muted"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-waha-gold rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-1.5 hover:bg-muted px-2 h-8 rounded-lg"
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-waha-gold/20 text-waha-dark text-[10px] font-medium">
                    أح
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">أحمد محمد</p>
                <p className="text-xs text-muted-foreground">موظف صرافة</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile">الملف الشخصي</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 cursor-pointer"
              >
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

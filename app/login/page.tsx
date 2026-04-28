"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Lock, User, Eye, EyeOff, Building2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "فشل تسجيل الدخول. يرجى التحقق من البيانات.")
      }

      // Store token and user info
      if (result.accessToken) {
        localStorage.setItem("alwaha_auth_token", result.accessToken)
      } else if (result.token) {
         localStorage.setItem("alwaha_auth_token", result.token)
      }
      
      localStorage.setItem("alwaha_user", JSON.stringify({
        id: result.id,
        username: result.username,
        email: result.email,
        roles: result.roles
      }))

      toast.success("تم تسجيل الدخول بنجاح")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "خطأ في الاتصال بالخادم")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-waha-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-waha-gold/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md px-6 py-12 relative z-10">
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="relative w-48 h-20 mb-2">
            <Image
              src="/logo.png"
              alt="Waha Bank Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-waha-gray-900 tracking-tight">لوحة تحكم العمليات</h1>
            <p className="text-muted-foreground text-sm mt-1">مصرف الواحة - نظام إدارة عمليات الصرف</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-black/[0.05]">
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-xl font-bold text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center text-xs">
              أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold mr-1">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="أدخل اسم المستخدم"
                    className="pr-10 h-11 bg-white/50 focus:bg-white transition-all border-border/50"
                    {...register("username")}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-[10px] text-destructive mt-1 mr-1">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold mr-1">كلمة المرور</Label>
                  <button type="button" className="text-[10px] text-waha-gold hover:underline font-medium">
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10 h-11 bg-white/50 focus:bg-white transition-all border-border/50"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-destructive mt-1 mr-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-4 text-sm font-bold bg-waha-gray-900 hover:bg-black text-white rounded-lg shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "دخول إلى النظام"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-[10px] text-muted-foreground">
          &copy; {new Date().getFullYear()} مصرف الواحة. جميع الحقوق محفوظة. قسم تقنية المعلومات.
        </p>
      </div>
    </div>
  )
}

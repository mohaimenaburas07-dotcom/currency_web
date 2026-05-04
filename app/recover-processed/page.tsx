"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Search, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type RecoveryResult = {
  success: boolean
  message: string
  sessionId?: string
  completed?: boolean
  action?: string
}

export default function RecoverProcessedPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<RecoveryResult | null>(null)

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) {
      toast.error("يرجى إدخال رقم الطلب أو الرقم المرجعي أو الرقم الوطني")
      return
    }

    setIsSearching(true)
    setResult(null)

    try {
      const token = localStorage.getItem("alwaha_auth_token")
      const userId = (() => {
        try { return JSON.parse(localStorage.getItem("alwaha_user") || "{}").username ?? "system" }
        catch { return "system" }
      })()

      const res = await fetch("/api/execution-sessions/recover-processed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q, userId }),
      })

      const data: RecoveryResult = await res.json()
      setResult(data)

      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err: any) {
      const msg = "تعذر إجراء البحث، يرجى التحقق من الاتصال بالشبكة"
      setResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResume = () => {
    if (result?.sessionId) {
      router.push(`/execute?id=${result.sessionId}`)
    }
  }

  const actionLabel =
    result?.action === "RECOVERED" ? "استكمال التوثيق المحلي" :
    result?.action === "RESUME_EXISTING" ? "استكمال الجلسة الموجودة" :
    result?.action === "OPEN_CUSTOMER_OR_SESSION" ? "فتح الجلسة المكتملة" :
    "استكمال التوثيق المحلي"

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8" dir="rtl">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-waha-gold/10 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-waha-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-waha-gray-900">استرجاع طلب منفذ</h1>
              <p className="text-xs font-bold text-waha-gray-400">استكمال التوثيق المحلي لطلب تم تنفيذه مسبقاً</p>
            </div>
          </div>

          <Card className="border-0 bg-amber-50 rounded-2xl shadow-none mt-4">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-amber-800 leading-relaxed">
                استخدم هذه الصفحة لاستكمال التوثيق المحلي لطلب تم تنفيذه في المنظومة ولم يكتمل محلياً.
                <br />
                <span className="text-amber-600 mt-1 block">
                  هذه الأداة لا تستدعي خدمة FCMS مطلقاً — فقط تُنشئ جلسة محلية للتوثيق.
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Card */}
        <Card className="border-0 shadow-card bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-waha-gray-700">
                رقم الطلب / الرقم المرجعي / الرقم الوطني
              </label>
              <div className="flex gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="أدخل UUID أو الرقم المرجعي أو الرقم الوطني"
                  className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold text-sm flex-1"
                  dir="ltr"
                  disabled={isSearching}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="h-12 px-6 bg-waha-gray-900 hover:bg-black text-white font-black rounded-xl gap-2 shrink-0"
                >
                  {isSearching
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Search className="w-4 h-4" />
                  }
                  {isSearching ? "جاري البحث..." : "بحث واسترجاع"}
                </Button>
              </div>
              <p className="text-[10px] font-bold text-waha-gray-400">
                للبحث في المنظومة الخارجية يجب إدخال UUID الطلب بالشكل الصحيح (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
              </p>
            </div>

            {/* Result */}
            {result && (
              <div className={cn(
                "rounded-2xl p-5 space-y-4 border animate-in fade-in duration-300",
                result.success
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-start gap-3">
                  {result.success
                    ? <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    : <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  }
                  <div className="space-y-1 flex-1">
                    <p className={cn(
                      "text-sm font-black",
                      result.success ? "text-emerald-800" : "text-red-700"
                    )}>
                      {result.message}
                    </p>

                    {result.sessionId && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-waha-gray-500">معرف الجلسة:</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black font-mono border-waha-gray-300 bg-white"
                        >
                          {result.sessionId}
                        </Badge>
                        {result.completed && (
                          <Badge className="text-[9px] font-black bg-emerald-100 text-emerald-700 border-emerald-200">
                            مكتملة
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {result.success && result.sessionId && (
                  <Button
                    onClick={handleResume}
                    className="w-full h-12 bg-waha-gray-900 hover:bg-black text-white font-black rounded-xl gap-2"
                  >
                    {actionLabel}
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "ما الفرق عن استكمال العمليات؟",
              body: "«استكمال العمليات» يستأنف جلسات محلية موجودة. هذه الصفحة تُنشئ جلسة جديدة من طلب منفذ في FCMS لا يوجد له سجل محلي.",
            },
            {
              title: "ما الذي لن يحدث هنا؟",
              body: "لن يتم استدعاء FCMS /process مجدداً. لن يتم إنشاء سجل عميل أو حركة مالية مكررة. التوثيق المحلي فقط.",
            },
          ].map((card) => (
            <Card key={card.title} className="border-0 shadow-sm bg-waha-gray-50 rounded-2xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-black text-waha-gray-700 mb-1">{card.title}</p>
                <p className="text-[10px] font-bold text-waha-gray-500 leading-relaxed">{card.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ClipboardList, RefreshCw, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function PendingLocalCompletionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/execution-sessions/pending-local-completion`)
      const data = await res.json()
      
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "تعذر تحميل العمليات")
      }
      
      setSessions(data.sessions || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const getStageLabel = (session: any) => {
    if (session.verificationStatus !== "DONE") return "التحقق من الهوية"
    if (session.countingStatus !== "DONE") return "العد النقدي"
    if (session.countingStatus === "DONE" && session.cameraStatus !== "DONE") return "الطباعة والتوثيق المرئي"
    if (session.cameraStatus === "DONE") return "جاهز للإنهاء"
    return "غير معروف"
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-waha-gold/10 text-waha-gold-dark text-[10px] font-black uppercase tracking-widest mb-2">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استكمال العمليات</span>
            </div>
            <h1 className="text-3xl font-black text-waha-gray-900 tracking-tight">
              العمليات التي تحتاج إلى استكمال
            </h1>
            <p className="text-sm font-bold text-waha-gray-400">
              قائمة بالعمليات المحلية التي تم البدء بها ولم تكتمل بعد
            </p>
          </div>
          <Button 
            onClick={fetchSessions} 
            variant="outline" 
            className="rounded-xl h-11 px-6 font-bold text-xs gap-2 border-waha-gray-100 hover:bg-waha-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </Button>
        </div>

        <Card className="border-none shadow-2xl shadow-waha-gray-900/5 overflow-hidden rounded-[2rem] bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-waha-gold animate-spin" />
                <p className="text-xs font-black text-waha-gray-400 uppercase tracking-widest animate-pulse">جاري التحميل...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-waha-gray-50 flex items-center justify-center mb-2">
                  <ClipboardList className="w-8 h-8 text-waha-gray-300" />
                </div>
                <p className="text-lg font-black text-waha-gray-900">لا توجد عمليات معلقة</p>
                <p className="text-xs font-bold text-waha-gray-400 max-w-sm">جميع العمليات تم استكمالها بنجاح</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-waha-gray-50 bg-waha-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest whitespace-nowrap">العميل</th>
                      <th className="px-6 py-4 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest whitespace-nowrap">الرقم الوطني</th>
                      <th className="px-6 py-4 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest whitespace-nowrap">الهاتف</th>
                      <th className="px-6 py-4 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest whitespace-nowrap">المرحلة الحالية</th>
                      <th className="px-6 py-4 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest whitespace-nowrap">آخر تحديث</th>
                      <th className="px-6 py-4 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest whitespace-nowrap">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-waha-gray-50">
                    {sessions.map((session) => (
                      <tr key={session.id} className="group hover:bg-waha-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-waha-gray-900">{session.customerFullNameAr || session.customerFullNameEn || "—"}</p>
                          <p className="text-[10px] font-bold text-waha-gray-400 mt-1">{session.purchaseRequestUuid}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-waha-gray-700">{session.customerNid || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-waha-gray-700" dir="ltr">{session.customerPhone || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-waha-gold/10 text-waha-gold-dark border-none font-bold text-[10px] px-3 py-1 rounded-full">
                            {getStageLabel(session)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-waha-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold" dir="ltr">
                              {new Date(session.updatedAt).toLocaleString("ar-LY")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            onClick={() => router.push(`/execute?id=${session.id}`)}
                            className="bg-waha-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs h-9 px-6 shadow-md shadow-waha-gray-900/10 transition-all hover:scale-105"
                          >
                            استكمال
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ListOrdered,
  Clock,
  User,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function RequestsQueuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)

  const fetchQueue = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/fx/queue?page=${page}`)
      if (!res.ok) throw new Error("Failed to fetch queue")
      const result = await res.json()
      setData(result)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [page])

  return (
    <DashboardLayout title="قائمة الانتظار" breadcrumb="العمليات">
      <div className="space-y-6">
        <Card className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden min-h-[500px]">
          <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-waha-gray-900 flex items-center justify-center text-waha-gold">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-waha-gray-900">سجل الطلبات وقائمة الانتظار</CardTitle>
                <p className="text-xs font-bold text-waha-gray-400 mt-1">عرض جميع الطلبات المصنفة في النظام المركزي</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-waha-gold" />
                <p className="text-sm font-bold text-waha-gray-400">جاري جلب قائمة الانتظار...</p>
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-waha-gray-50 flex items-center justify-center text-waha-gray-200 mb-2">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-waha-gray-900">القائمة فارغة حالياً</h3>
                <p className="text-xs font-bold text-waha-gray-400 max-w-xs mx-auto">لم يتم العثور على أي طلبات في قائمة الانتظار حالياً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-waha-gray-50/50">
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50">المرجع</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50">العميل</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">المبلغ</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">الحالة</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((req: any) => (
                      <tr key={req.uuid} className="group hover:bg-waha-gray-50/20 transition-all border-b border-waha-gray-50 last:border-0">
                        <td className="p-5">
                          <span className="text-xs font-mono font-black text-waha-gray-900 bg-white border border-waha-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
                            {req.reference}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-waha-gray-50 flex items-center justify-center text-waha-gray-400">
                               <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-waha-gray-900 leading-tight">{req.user_name || "بدون اسم"}</span>
                              <span className="text-[10px] font-bold text-waha-gray-400">{new Date(req.created_at).toLocaleDateString("ar-LY")}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className="text-sm font-black text-emerald-600" dir="ltr">
                            {Number(req.amount_requested).toLocaleString()} {req.currency}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <Badge variant="outline" className="bg-waha-gray-50 text-waha-gray-600 border-waha-gray-100 text-[9px] font-bold px-3 py-1 rounded-full uppercase">
                             {req.state || "قيد الانتظار"}
                          </Badge>
                        </td>
                        <td className="p-5 text-center">
                           <Button 
                             onClick={() => router.push(`/execute?id=${req.uuid}`)}
                             variant="ghost" 
                             className="h-9 w-9 p-0 rounded-full hover:bg-waha-gold/10 hover:text-waha-gold transition-all"
                           >
                              <ArrowRight className="w-5 h-5" />
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data?.meta && data.meta.last_page > 1 && (
              <div className="p-8 flex items-center justify-between bg-waha-gray-50/30">
                <span className="text-[11px] font-bold text-waha-gray-400 uppercase tracking-widest">
                  الصفحة {page} من {data.meta.last_page}
                </span>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-waha-gray-200 bg-white shadow-sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronRight className="w-4 h-4 ml-2" />
                    السابق
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-waha-gray-200 bg-white shadow-sm"
                    disabled={page === data.meta.last_page}
                    onClick={() => setPage(p => p + 1)}
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

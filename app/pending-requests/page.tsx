"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PendingRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)
  
  const [filters, setFilters] = useState({
    reference: "",
    phone: "",
    nid: ""
  })

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (filters.reference) query.set("filter[reference]", filters.reference)
      if (filters.phone) query.set("filter[phone]", filters.phone)
      if (filters.nid) query.set("filter[nid]", filters.nid)
      query.set("page", page.toString())

      const res = await fetch(`/api/fx/pending-requests?${query.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch pending requests")
      const result = await res.json()
      setData(result)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchRequests()
  }

  const handleApprove = async (uuid: string) => {
    try {
      setApprovingId(uuid)
      const res = await fetch(`/api/fx/approve/${uuid}`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Approval failed")
      }
      toast.success("تمت الموافقة على الطلب بنجاح")
      router.push(`/execute?id=${uuid}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <DashboardLayout title="الطلبات المعلقة" breadcrumb="الحجوزات">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-waha-gray-400">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">تصفية النتائج</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-waha-gray-500 mr-2 uppercase">رقم المرجع</label>
                <Input 
                  placeholder="مثال: REF-123"
                  className="rounded-xl bg-waha-gray-50 border-waha-gray-100"
                  value={filters.reference}
                  onChange={(e) => setFilters(p => ({ ...p, reference: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-waha-gray-500 mr-2 uppercase">رقم الهاتف</label>
                <Input 
                  placeholder="091XXXXXXX"
                  className="rounded-xl bg-waha-gray-50 border-waha-gray-100"
                  value={filters.phone}
                  onChange={(e) => setFilters(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-waha-gray-500 mr-2 uppercase">الرقم الوطني</label>
                <Input 
                  placeholder="119XXXXXXXXX"
                  className="rounded-xl bg-waha-gray-50 border-waha-gray-100"
                  value={filters.nid}
                  onChange={(e) => setFilters(p => ({ ...p, nid: e.target.value }))}
                />
              </div>
              <Button type="submit" className="bg-waha-gray-900 hover:bg-black rounded-xl h-10 gap-2">
                <Search className="w-4 h-4" />
                <span>بحث</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden min-h-[400px]">
          <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-waha-gray-900">قائمة الانتظار للموافقة</CardTitle>
                <p className="text-xs font-bold text-waha-gray-400 mt-1">طلبات بانتظار الاعتماد لبدء التنفيذ</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-waha-gold" />
                <p className="text-sm font-bold text-waha-gray-400">جاري جلب البيانات من النظام المركزي...</p>
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-waha-gray-50 flex items-center justify-center text-waha-gray-200">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-waha-gray-400">لا توجد طلبات تطابق معايير البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-waha-gray-50/50">
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50">رقم المرجع</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50">العميل</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50">المبلغ</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50">التاريخ</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((req: any) => (
                      <tr key={req.uuid} className="group hover:bg-waha-gray-50/50 transition-colors">
                        <td className="p-5 border-b border-waha-gray-50">
                          <span className="text-xs font-mono font-bold text-waha-gray-900 bg-waha-gray-100 px-2 py-1 rounded-lg border border-waha-gray-200">
                            {req.reference}
                          </span>
                        </td>
                        <td className="p-5 border-b border-waha-gray-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-waha-gray-900">{req.user_name || "بدون اسم"}</span>
                            <span className="text-[10px] font-bold text-waha-gray-400">{req.nid || req.phone || "—"}</span>
                          </div>
                        </td>
                        <td className="p-5 border-b border-waha-gray-50">
                          <span className="text-sm font-black text-emerald-600" dir="ltr">
                            {Number(req.amount_requested).toLocaleString()} {req.currency}
                          </span>
                        </td>
                        <td className="p-5 border-b border-waha-gray-50">
                          <span className="text-[11px] font-bold text-waha-gray-500">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString("ar-LY") : "—"}
                          </span>
                        </td>
                        <td className="p-5 border-b border-waha-gray-50 text-center">
                          <Button 
                            disabled={approvingId === req.uuid}
                            onClick={() => handleApprove(req.uuid)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-6 font-bold text-xs gap-2 shadow-lg shadow-emerald-600/10"
                          >
                            {approvingId === req.uuid ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            <span>اعتماد</span>
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
              <div className="p-6 border-t border-waha-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-waha-gray-400 uppercase tracking-widest">
                  الصفحة {page} من {data.meta.last_page}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-waha-gray-100"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-waha-gray-100"
                    disabled={page === data.meta.last_page}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
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

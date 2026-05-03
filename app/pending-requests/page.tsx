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
  AlertCircle,
  Eye,
  Info,
  Banknote,
  CreditCard,
  User as UserIcon,
  Globe
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PendingRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [isExecuting, setIsExecuting] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    reference: "",
    phone: "",
    nid: ""
  })

  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

  const handleExecute = async (req: any) => {
    try {
      setIsExecuting(req.uuid)
      const token = localStorage.getItem("alwaha_auth_token")
      const res = await fetch(`/api/purchase-requests/${req.uuid}/start-execution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: "current-user",
          requestSnapshot: req
        })
      })
      
      const sessionData = await res.json()
      if (!res.ok) throw new Error(sessionData.error || "Failed to start execution")
      
      router.push(`/execute?id=${sessionData.sessionId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsExecuting(null)
    }
  }

  const handleApprove = async (req: any) => {
    try {
      setApprovingId(req.uuid)
      const res = await fetch(`/api/fx/approve/${req.uuid}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts: req.timestamp || Math.floor(Date.now() / 1000) })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Approval failed")
      }
      toast.success("تمت الموافقة على الطلب بنجاح")
      handleExecute(req)
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
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-right">رقم المرجع</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-right">العميل</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">المبلغ</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">التاريخ</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((req: any) => (
                      <tr key={req.uuid} className="group hover:bg-waha-gray-50/50 transition-colors border-b border-waha-gray-50 last:border-0">
                        <td className="p-5">
                          <span className="text-xs font-mono font-bold text-waha-gray-900 bg-waha-gray-100 px-2 py-1 rounded-lg border border-waha-gray-200">
                            {req.reference}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-waha-gray-900">
                              {req.bankAccount?.user?.first_name ? 
                               `${req.bankAccount.user.first_name} ${req.bankAccount.user.father_name || ""} ${req.bankAccount.user.grandfather_name || ""} ${req.bankAccount.user.last_name || ""}`.trim() : 
                               (req.bankAccount?.user?.full_name_en || req.user_name || "بدون اسم")
                              }
                            </span>
                            <span className="text-[10px] font-bold text-waha-gray-400">
                               {req.bankAccount?.user?.nid || req.nid || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className="text-sm font-black text-emerald-600" dir="ltr">
                            {Number(req.amount_requested).toLocaleString()} {req.currency || "USD"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                           <span className="text-[11px] font-bold text-waha-gray-500">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString("ar-LY") : "—"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedRequest(req); setIsDetailsOpen(true); }}
                              className="h-9 px-4 rounded-xl border-waha-gray-200 font-bold text-xs gap-2 bg-white hover:bg-waha-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل</span>
                            </Button>
                            <Button 
                              disabled={approvingId === req.uuid || isExecuting === req.uuid}
                              onClick={() => handleApprove(req)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-6 font-bold text-xs gap-2 shadow-lg shadow-emerald-600/10"
                            >
                              {approvingId === req.uuid || isExecuting === req.uuid ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              <span>اعتماد</span>
                            </Button>
                          </div>
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

        {/* Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-[2rem] border-0 p-0 overflow-hidden shadow-2xl">
            {selectedRequest && (
              <>
                <DialogHeader className="p-8 bg-waha-gray-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-waha-gold/20 flex items-center justify-center text-waha-gold">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-black">تفاصيل طلب الشراء</DialogTitle>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{selectedRequest.reference}</p>
                      </div>
                    </div>
                    <Badge className="bg-waha-gold text-waha-gray-900 border-0 font-bold px-4 py-1.5 rounded-full text-[10px]">
                      {selectedRequest.state?.name || "قيد الانتظار"}
                    </Badge>
                  </div>
                </DialogHeader>
                
                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                  {/* Amount Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-waha-gray-50 p-6 rounded-3xl border border-waha-gray-100">
                       <div className="flex items-center gap-2 text-waha-gray-400 mb-2">
                          <Banknote className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">المبلغ المطلوب</span>
                       </div>
                       <div className="text-2xl font-black text-waha-gray-900" dir="ltr">
                          {Number(selectedRequest.amount_requested).toLocaleString()} {selectedRequest.currency || "USD"}
                       </div>
                    </div>
                    <div className="bg-waha-gray-50 p-6 rounded-3xl border border-waha-gray-100">
                       <div className="flex items-center gap-2 text-waha-gray-400 mb-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">وسيلة الدفع</span>
                       </div>
                       <div className="text-lg font-black text-waha-gray-900">
                          {selectedRequest.deposit_type?.name || "—"}
                       </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 pb-2 flex items-center gap-2">
                       <UserIcon className="w-3.5 h-3.5" /> معلومات العميل
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">الاسم الكامل (AR)</span>
                          <p className="text-sm font-bold text-waha-gray-900">
                             {selectedRequest.bankAccount?.user?.first_name ? 
                               `${selectedRequest.bankAccount.user.first_name} ${selectedRequest.bankAccount.user.father_name || ""} ${selectedRequest.bankAccount.user.grandfather_name || ""} ${selectedRequest.bankAccount.user.last_name || ""}`.trim() : 
                               (selectedRequest.user_name || "—")
                             }
                          </p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">الاسم الكامل (EN)</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.bankAccount?.user?.full_name_en || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">الرقم الوطني</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.bankAccount?.user?.nid || selectedRequest.nid || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">رقم الهاتف</span>
                          <p className="text-sm font-bold text-waha-gray-900" dir="ltr">{selectedRequest.bankAccount?.user?.phone || selectedRequest.phone || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">رقم جواز السفر</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.bankAccount?.user?.passport_number || "—"}</p>
                       </div>
                    </div>
                  </div>

                  {/* Bank & Company */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 pb-2 flex items-center gap-2">
                       <Globe className="w-3.5 h-3.5" /> بيانات الحساب والجهة
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1 col-span-2">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">IBAN</span>
                          <p className="text-xs font-mono font-bold text-waha-gray-900 bg-waha-gray-50 p-3 rounded-xl border border-waha-gray-100" dir="ltr">
                             {selectedRequest.bankAccount?.iban || "—"}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">فرع التنفيذ</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.usd_provider_branch?.name || selectedRequest.bank_branch?.name || "غير محدد"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">اسم الشركة</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.company?.name || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">رمز CBL</span>
                          <p className="text-sm font-mono font-bold text-waha-gold">{selectedRequest.company?.cbl_key || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">تاريخ الطلب</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString("ar-LY") : "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">CBS Timestamp</span>
                          <p className="text-sm font-mono font-bold text-waha-gray-400">{selectedRequest.timestamp || "—"}</p>
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3 border-t border-waha-gray-50">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsDetailsOpen(false)}
                      className="rounded-xl font-bold text-xs h-11 px-8 text-waha-gray-400"
                    >
                      إغلاق
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsDetailsOpen(false);
                        handleApprove(selectedRequest);
                      }}
                      className="bg-waha-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs h-11 px-8 shadow-xl shadow-waha-gray-900/10"
                    >
                      اعتماد الطلب الآن
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

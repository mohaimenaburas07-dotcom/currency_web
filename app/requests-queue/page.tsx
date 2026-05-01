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
  ArrowRight,
  CheckCircle,
  Eye,
  Info,
  Banknote,
  CreditCard,
  User as UserIcon,
  Globe
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function RequestsQueuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

  const handleExecute = async (req: any) => {
    try {
      setIsExecuting(req.uuid)
      const token = localStorage.getItem("alwaha_auth_token")

      // 1. Check for existing session first
      const checkRes = await fetch(`/api/execution-sessions/by-purchase-request/${req.uuid}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (checkRes.ok) {
        const session = await checkRes.json()
        if (session && session.id) {
          router.push(`/execute?id=${session.id}`)
          return
        }
      }

      // 2. Start new if not found
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
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-right">المرجع</th>
                      <th className="p-5 text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-50 text-right">العميل</th>
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
                              <span className="text-sm font-black text-waha-gray-900 leading-tight">
                                {req.bankAccount?.user?.full_name_en || 
                                 (req.bankAccount?.user?.first_name ? 
                                   `${req.bankAccount.user.first_name} ${req.bankAccount.user.father_name || ""} ${req.bankAccount.user.grandfather_name || ""} ${req.bankAccount.user.last_name || ""}`.trim() : 
                                   req.user_name || "بدون اسم")
                                }
                              </span>
                              <span className="text-[10px] font-bold text-waha-gray-400">
                                ر.و: {req.bankAccount?.user?.nid || req.nid || "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className="text-sm font-black text-emerald-600" dir="ltr">
                            {Number(req.amount_requested).toLocaleString()} {req.currency || "USD"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold px-3 py-1 rounded-full uppercase",
                            req.state?.code === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            req.state?.code === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-waha-gray-50 text-waha-gray-600 border-waha-gray-100"
                          )}>
                             {req.state?.name || "قيد الانتظار"}
                          </Badge>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <Button 
                               variant="outline"
                               size="sm"
                               onClick={() => { setSelectedRequest(req); setIsDetailsOpen(true); }}
                               className="h-8 rounded-lg border-waha-gray-200 font-bold text-[10px] gap-1.5 bg-white hover:bg-waha-gray-50"
                             >
                               <Eye className="w-3.5 h-3.5" />
                               <span>تفاصيل</span>
                             </Button>

                             {req.state?.code === 'pending' && (
                               <Button 
                                 size="sm"
                                 disabled={approvingId === req.uuid || isExecuting === req.uuid}
                                 onClick={() => handleApprove(req)}
                                 className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold gap-1.5 px-3"
                               >
                                 {approvingId === req.uuid || isExecuting === req.uuid ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                 اعتماد
                               </Button>
                             )}
                             {(req.state?.code === 'approved' || req.state?.code === 'processed') && (
                               <Button 
                                 size="sm"
                                 disabled={isExecuting === req.uuid}
                                 onClick={() => handleExecute(req)}
                                 className="h-8 rounded-lg bg-waha-gray-900 hover:bg-black text-white text-[10px] font-bold gap-1.5 px-3"
                               >
                                 {isExecuting === req.uuid ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                 {req.state?.code === 'processed' ? "عرض" : "تنفيذ"}
                               </Button>
                             )}
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
                          <span className="text-[9px] font-black text-waha-gray-400 uppercase">اسم الشركة</span>
                          <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.company?.name || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-waha-gold uppercase">رمز CBL</span>
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
                    {selectedRequest.state?.code === 'pending' && (
                      <Button 
                        onClick={() => {
                          setIsDetailsOpen(false);
                          handleApprove(selectedRequest);
                        }}
                        className="bg-waha-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs h-11 px-8 shadow-xl shadow-waha-gray-900/10"
                      >
                        اعتماد الطلب الآن
                      </Button>
                    )}
                    {(selectedRequest.state?.code === 'approved' || selectedRequest.state?.code === 'processed') && (
                      <Button 
                        onClick={() => {
                          setIsDetailsOpen(false);
                          handleExecute(selectedRequest);
                        }}
                        className="bg-waha-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs h-11 px-8 shadow-xl shadow-waha-gray-900/10"
                      >
                        {selectedRequest.state?.code === 'processed' ? "عرض التفاصيل" : "تنفيذ العملية"}
                      </Button>
                    )}
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

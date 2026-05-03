"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Filter, Loader2, ChevronRight, ChevronLeft, CheckCircle2, Clock, XCircle, FileText, User as UserIcon, Globe, Building2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "مقبول", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700 border-red-200" },
  declined: { label: "مرفوض", color: "bg-red-100 text-red-700 border-red-200" },
  processed: { label: "تم التنفيذ", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "تم التنفيذ", color: "bg-blue-100 text-blue-700 border-blue-200" },
  fallback: { label: "غير معروف", color: "bg-slate-100 text-slate-700 border-slate-200" },
}

export function ReservationsTable() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<any>(null)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  // Filters State
  const [filters, setFilters] = useState({
    state: "All",
    type: "All",
    reference: "",
    cbl_key: "",
    approved_on: ""
  })

  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alwaha_auth_token") : ""
      const headers: any = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const query = new URLSearchParams()
      query.append("limit", "15")
      query.append("page", page.toString())
      if (filters.state && filters.state !== "All") query.append("filter[state]", filters.state)
      if (filters.type && filters.type !== "All") query.append("filter[type]", filters.type)
      if (filters.reference) query.append("filter[reference]", filters.reference)
      if (filters.cbl_key) query.append("filter[cbl_key]", filters.cbl_key)
      if (filters.approved_on) query.append("filter[approved_on]", filters.approved_on)

      const res = await fetch(`/api/v1/fx-houses/purchase-requests?${query.toString()}`, { headers })

      if (res.status === 401) {
        localStorage.removeItem("alwaha_auth_token")
        router.push("/login")
        return
      }

      const resText = await res.text()
      let json = null
      try {
        json = JSON.parse(resText)
      } catch (err) {
        if (resText.includes("Internal Server Error")) {
          setData([])
          setLoading(false)
          return
        }
      }

      if (json && json.data && Array.isArray(json.data)) {
        setData(json.data)
      } else {
        setData([])
      }

      if (json && json.meta) {
        setMeta(json.meta)
      }
    } catch (e) {
      console.error("Error fetching purchase requests:", e)
    } finally {
      setLoading(false)
    }
  }, [filters, page, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const getCurrencyIcon = (code: string) => {
    if (!code) return "$"
    if (code.includes("USD")) return "$"
    if (code.includes("EUR")) return "€"
    if (code.includes("GBP")) return "£"
    return "$"
  }

  const getCurrencyName = (code: string) => {
    if (!code) return "دولار أمريكي"
    if (code.includes("USD")) return "دولار أمريكي"
    if (code.includes("EUR")) return "يورو"
    if (code.includes("GBP")) return "جنيه إسترليني"
    return code
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString("ar-LY", { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard 
          label="إجمالي الطلبات" 
          value={meta?.total?.toLocaleString() || "0"} 
          icon={FileText} 
          color="waha-gold" 
        />
        <SummaryCard 
          label="قيد الانتظار" 
          value="245" 
          icon={Clock} 
          color="amber-500" 
        />
        <SummaryCard 
          label="تم التنفيذ" 
          value="8,102" 
          icon={CheckCircle2} 
          color="emerald-500" 
        />
        <SummaryCard 
          label="مرفوض" 
          value="45" 
          icon={XCircle} 
          color="red-500" 
        />
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-card bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 pb-4 space-y-6">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-waha-gold rounded-full" />
              <CardTitle className="text-xl font-bold text-waha-gray-900">طابور طلبات الشراء</CardTitle>
            </div>
            <Button onClick={() => { setPage(1); fetchData() }} className="h-10 gap-2 px-6 bg-waha-gold hover:bg-waha-gold-dark text-waha-gray-900 border-0 rounded-xl font-bold shadow-lg shadow-waha-gold/20">
              <Filter className="w-4 h-4" />
              تطبيق التصفية
            </Button>
          </div>

          {/* Elegant Filter Area */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-waha-gray-50 rounded-xl border border-waha-gray-200/50">
            <FilterItem label="المرجع" placeholder="رقم الطلب" value={filters.reference} onChange={(v) => handleFilterChange('reference', v)} />
            <FilterItem label="CBL Key" placeholder="CBL Key" value={filters.cbl_key} onChange={(v) => handleFilterChange('cbl_key', v)} />
            
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-waha-gray-500 px-1">الحالة</span>
              <Select value={filters.state} onValueChange={(val) => handleFilterChange('state', val)}>
                <SelectTrigger className="h-10 text-xs border-waha-gray-200 bg-white rounded-xl focus:ring-waha-gold">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-waha-gray-200">
                  <SelectItem value="All">الكل</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="approved">مقبول</SelectItem>
                  <SelectItem value="processed">تم التنفيذ</SelectItem>
                  <SelectItem value="declined">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-waha-gray-500 px-1">نوع الطلب</span>
              <Select value={filters.type} onValueChange={(val) => handleFilterChange('type', val)}>
                <SelectTrigger className="h-10 text-xs border-waha-gray-200 bg-white rounded-xl focus:ring-waha-gold">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-waha-gray-200">
                  <SelectItem value="All">الكل</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="credit">ائتمان</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-waha-gray-500 px-1">تاريخ الاعتماد</span>
              <div className="relative">
                <input 
                  type="date" 
                  value={filters.approved_on} 
                  onChange={(e) => handleFilterChange('approved_on', e.target.value)} 
                  className="w-full h-10 text-xs px-4 border border-waha-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-waha-gold/20 focus:border-waha-gold transition-all" 
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-waha-gold" />
              </div>
            )}

            {data.length === 0 && !loading && (
              <div className="py-24 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium">لا توجد طلبات بناءً على معايير البحث</p>
              </div>
            )}

            {data.length > 0 && (
              <Table dir="rtl">
                <TableHeader>
                  <TableRow className="border-y border-waha-gray-100 hover:bg-transparent">
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 px-4 uppercase tracking-wider">العميل</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">المرجع</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">نوع الطلب</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">تاريخ الطلب</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">المبلغ</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">القيمة (د.ل)</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">الحالة</TableHead>
                    <TableHead className="text-center text-[10px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((req, index) => {
                    const u = req?.bankAccount?.user || {};
                    const customerName = u.first_name
                      ? `${u.first_name} ${u.father_name || ""} ${u.grandfather_name || ""} ${u.last_name || ""}`.trim()
                      : (u.full_name_en || req.user_name || "بدون اسم");
                    const accountNumber = req?.bankAccount?.account_number || req?.bankAccount?.iban?.slice(-8) || "—";
                    const rateRaw = req.contract?.bank_transfer_price || req.exchange_rate || 0
                    const rate = typeof rateRaw === 'object' && rateRaw !== null ? Number(rateRaw.rate || 0) : Number(rateRaw)
                    const currencyCode = req.contract?.currency_code || "USD";
                    const stateStr = typeof req.state === "object" ? req.state?.code || "pending" : (req.state || "pending");
                    const mappedState = statusConfig[stateStr.toLowerCase()] || statusConfig.fallback;

                    return (
                      <TableRow key={req.uuid || index} className="group hover:bg-waha-gray-50/50 border-b-waha-gray-50 transition-all duration-300">
                        <TableCell className="py-2 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-waha-gray-50 group-hover:bg-white flex items-center justify-center text-waha-gold font-bold text-sm border border-transparent group-hover:border-waha-gold/20 transition-all shadow-sm">
                              {getCurrencyIcon(currencyCode)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-waha-gray-900">{customerName}</span>
                              <span className="text-[10px] text-waha-gray-400 mt-0.5">{accountNumber}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-[11px] font-mono text-waha-gray-500 bg-waha-gray-50 px-2 py-0.5 rounded">{req.reference || "—"}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-[11px] font-semibold text-waha-gray-700">{req.type?.name || "—"}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-[11px] text-waha-gray-500 font-medium">{formatDate(req.created_at)}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-waha-gray-900">{parseInt(req.amount_requested || "0").toLocaleString()}</span>
                            <span className="text-[9px] text-waha-gray-400 font-bold">{currencyCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-xs font-extrabold text-emerald-600">
                            {Number(req.cost || 0).toLocaleString()} د.ل
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className={`${mappedState.color} font-bold text-[9px] px-2 py-0.5 rounded-full border`}>
                            {mappedState.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {stateStr.toLowerCase() === 'approved' && (
                              <Button size="sm" className="h-7 px-3 rounded-lg bg-waha-gold hover:bg-waha-gold-dark text-waha-gray-900 font-bold text-[10px] shadow-sm transition-all hover:scale-105" asChild>
                                <Link href={`/execute?id=${req.uuid}&step=1`}>بدء التنفيذ</Link>
                              </Button>
                            )}
                            {stateStr.toLowerCase() === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 px-3 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px]">
                                  قبول
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 font-bold text-[10px]">
                                  رفض
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 px-3 rounded-lg text-waha-gray-400 hover:text-waha-gray-900 font-bold text-[10px]" onClick={() => setSelectedRequest(req)}>
                              تفاصيل
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Premium Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex flex-row-reverse items-center justify-between p-8 bg-waha-gray-50/50">
              <span className="text-xs font-bold text-waha-gray-400">
                الصفحة <span className="text-waha-gray-900">{meta.current_page}</span> من <span className="text-waha-gray-900">{meta.last_page}</span>
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-xl border-waha-gray-200 bg-white hover:bg-waha-gold hover:border-waha-gold hover:text-waha-gray-900 font-bold"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-xl border-waha-gray-200 bg-white hover:bg-waha-gold hover:border-waha-gold hover:text-waha-gray-900 font-bold"
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page || loading}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="bg-waha-gray-900 text-white p-6 rounded-t-xl -mx-6 -mt-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black">
                  تفاصيل طلب الشراء
                </DialogTitle>
                {selectedRequest && (
                  <p className="text-waha-gold font-mono text-sm mt-1">{selectedRequest.reference}</p>
                )}
              </div>
              {selectedRequest && (
                <Badge className={`${ (statusConfig[typeof selectedRequest.state === 'object' ? selectedRequest.state?.code : selectedRequest.state]?.color || statusConfig.fallback.color) } font-bold text-xs`}>
                  {statusConfig[typeof selectedRequest.state === 'object' ? selectedRequest.state?.code : selectedRequest.state]?.label || "—"}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedRequest && (() => {
            const u = selectedRequest.bankAccount?.user || {}
            const arName = u.first_name
              ? `${u.first_name} ${u.father_name || ""} ${u.grandfather_name || ""} ${u.last_name || ""}`.trim()
              : "—"
            const rateRaw = selectedRequest.contract?.bank_transfer_price || selectedRequest.exchange_rate || 0
            const rate = typeof rateRaw === 'object' && rateRaw !== null ? Number(rateRaw.rate || 0) : Number(rateRaw)
            const amount = parseInt(selectedRequest.amount_requested || "0")
            const lyd = Number(selectedRequest.cost || 0).toLocaleString()
            const currency = selectedRequest.contract?.currency_code || "USD"

            return (
              <div className="space-y-5 pt-4">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-100 pb-2 flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5" /> معلومات العميل
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">الاسم الكامل (AR)</span>
                      <p className="text-sm font-bold text-waha-gray-900">{arName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">الاسم الكامل (EN)</span>
                      <p className="text-sm font-bold text-waha-gray-900">{u.full_name_en || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">الرقم الوطني</span>
                      <p className="text-sm font-bold text-waha-gray-900">{u.nid || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">رقم جواز السفر</span>
                      <p className="text-sm font-bold text-waha-gray-900">{u.passport_number || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">رقم الهاتف</span>
                      <p className="text-sm font-bold text-waha-gray-900" dir="ltr">{u.phone || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-100 pb-2 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> بيانات الحساب والجهة
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">IBAN</span>
                      <p className="text-sm font-mono font-bold text-waha-gray-900" dir="ltr">{selectedRequest.bankAccount?.iban || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">فرع التنفيذ</span>
                      <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.usd_provider_branch?.name || selectedRequest.bank_branch?.name || "غير محدد"}</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest border-b border-waha-gray-100 pb-2 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> تفاصيل المعاملة
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">اسم الشركة</span>
                      <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.company?.[0]?.name || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">CBS TIMESTAMP</span>
                      <p className="text-sm font-mono font-bold text-waha-gray-900" dir="ltr">{selectedRequest.timestamp || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">تاريخ الطلب</span>
                      <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString('ar-LY') : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-waha-gray-400 uppercase">نوع الإيداع</span>
                      <p className="text-sm font-bold text-waha-gray-900">{selectedRequest.deposit_type?.name || selectedRequest.type?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="bg-waha-gray-900 rounded-2xl p-4 grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-[9px] font-bold text-white/40 uppercase mb-1">المبلغ المطلوب</p>
                      <p className="text-2xl font-black text-waha-gold">{amount.toLocaleString()} <span className="text-sm">{currency}</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-white/40 uppercase mb-1">المعادل بالدينار</p>
                      <p className="text-lg font-black text-white">{lyd} <span className="text-sm text-white/60">د.ل</span></p>
                      <p className="text-[9px] text-white/40 mt-1">سعر الصرف: {rate || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <Card className="border-0 shadow-premium bg-white rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className={`absolute right-0 top-0 w-1 h-full bg-${color}`} />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className="text-xl font-black text-slate-900">{value}</span>
        </div>
      </div>
    </Card>
  )
}

function FilterItem({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-waha-gray-500 px-1">{label}</span>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full h-8 text-[11px] px-3 border border-waha-gray-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-waha-gold/20 focus:border-waha-gold transition-all" 
      />
    </div>
  )
}


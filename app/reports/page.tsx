"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileBarChart,
  Printer,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Shield,
} from "lucide-react"

const reports = [
  {
    id: 1,
    title: "تقرير المعاملات اليومية",
    description: "ملخص جميع المعاملات المنفذة خلال اليوم",
    type: "daily",
    lastGenerated: "اليوم 10:30 ص",
    icon: FileText,
  },
  {
    id: 2,
    title: "تقرير الحجوزات الأسبوعي",
    description: "إحصائيات الحجوزات خلال الأسبوع الماضي",
    type: "weekly",
    lastGenerated: "15 يناير 2024",
    icon: Calendar,
  },
  {
    id: 3,
    title: "تقرير العملاء الشهري",
    description: "تحليل نشاط العملاء والعملاء الجدد",
    type: "monthly",
    lastGenerated: "1 يناير 2024",
    icon: Users,
  },
  {
    id: 4,
    title: "تقرير الأداء المالي",
    description: "تحليل مفصل للتدفقات المالية",
    type: "financial",
    lastGenerated: "1 يناير 2024",
    icon: DollarSign,
  },
]

const actionLabels: Record<string, string> = {
  EXECUTION_STARTED: "بدء التنفيذ",
  IDENTITY_VERIFIED: "التحقق من الهوية",
  DOCUMENT_UPLOADED: "رفع مستند",
  PHOTO_UPLOADED: "رفع صورة",
  VIDEO_UPLOADED: "رفع فيديو",
  CASH_COUNT_SAVED: "حفظ عد النقود",
  RECEIPT_GENERATED: "إنشاء الإيصال",
  SIGNATURE_SAVED: "حفظ التوقيع",
  FINGERPRINT_SAVED: "حفظ البصمة",
  EXECUTION_CONFIRMED: "تأكيد التنفيذ",
  TRANSACTION_CREATED: "إنشاء معاملة",
  CLIENT_RECORD_CREATED: "إنشاء سجل عميل",
  SESSION_CANCELLED: "إلغاء الجلسة",
  SESSION_STATUS_CHANGED: "تغيير حالة الجلسة",
  HARDWARE_CAMERA_SNAPSHOT: "لقطة الكاميرا",
  HARDWARE_CAMERA_RECORD_START: "بدء تسجيل الكاميرا",
  HARDWARE_CAMERA_RECORD_STOP: "إيقاف تسجيل الكاميرا",
  HARDWARE_COUNTER_READ: "قراءة عداد النقود",
  HARDWARE_PRINTER_PRINT: "طباعة",
  USER_LOGIN: "تسجيل دخول",
  USER_LOGOUT: "تسجيل خروج",
  MEDIA_DELETED: "حذف ملف",
}

const actionColors: Record<string, string> = {
  EXECUTION_CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  EXECUTION_STARTED: "bg-blue-100 text-blue-700 border-blue-200",
  SESSION_CANCELLED: "bg-red-100 text-red-700 border-red-200",
  DOCUMENT_UPLOADED: "bg-amber-100 text-amber-700 border-amber-200",
  PHOTO_UPLOADED: "bg-amber-100 text-amber-700 border-amber-200",
  VIDEO_UPLOADED: "bg-amber-100 text-amber-700 border-amber-200",
  USER_LOGIN: "bg-violet-100 text-violet-700 border-violet-200",
  USER_LOGOUT: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIA_DELETED: "bg-red-100 text-red-700 border-red-200",
}

function formatDate(d: string | Date) {
  if (!d) return "—"
  return new Date(d).toLocaleString("ar-LY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function ReportsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditMeta, setAuditMeta] = useState<any>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditPage, setAuditPage] = useState(1)
  const [filterAction, setFilterAction] = useState("All")

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alwaha_auth_token") : ""
      const query = new URLSearchParams({ page: auditPage.toString(), limit: "30" })
      if (filterAction && filterAction !== "All") query.set("action", filterAction)
      const res = await fetch(`/api/audit-logs?${query.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const json = await res.json()
        setAuditLogs(json.data ?? [])
        setAuditMeta(json.meta ?? null)
      }
    } catch (e) {
      console.error("[Audit Logs]", e)
    } finally {
      setAuditLoading(false)
    }
  }, [auditPage, filterAction])

  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dailyRecords, setDailyRecords] = useState<any[]>([])
  const [reportLoading, setReportLoading] = useState(false)

  const fetchDailyReport = useCallback(async () => {
    if (!reportDate) return
    setReportLoading(true)
    try {
      const res = await fetch(`/api/reports/daily?date=${reportDate}`)
      if (res.ok) {
        const json = await res.json()
        setDailyRecords(json.records || [])
      } else {
        setDailyRecords([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setReportLoading(false)
    }
  }, [reportDate])

  useEffect(() => {
    fetchDailyReport()
  }, [fetchDailyReport])

  const downloadXlsx = () => {
    if (!reportDate) return
    window.location.href = `/api/reports/daily?date=${reportDate}&format=xlsx`
  }

  return (
    <DashboardLayout title="التقارير" breadcrumb="تحليلات وتقارير">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">مركز التقارير</h2>
            <p className="text-sm text-muted-foreground">عرض وتحميل التقارير والإحصائيات</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="gap-2 bg-waha-gold hover:bg-waha-gold-dark text-waha-gray-900" onClick={fetchDailyReport} disabled={reportLoading}>
              {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
              تحديث البيانات
            </Button>
          </div>
        </div>

        {/* Tabs: Reports + Audit Logs */}
        <Tabs defaultValue="reports" dir="rtl">
          <TabsList className="bg-waha-gray-50 border border-waha-gray-100 rounded-xl p-1 h-auto gap-1">
            <TabsTrigger value="reports" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 gap-2">
              <FileText className="w-3.5 h-3.5" /> التقارير اليومية
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 gap-2">
              <Shield className="w-3.5 h-3.5" /> سجل الأحداث
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">تاريخ التقرير:</span>
                  <input 
                    type="date" 
                    value={reportDate} 
                    onChange={(e) => setReportDate(e.target.value)} 
                    className="border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-waha-gold"
                  />
                </div>
                <Button 
                  onClick={downloadXlsx} 
                  disabled={reportLoading || dailyRecords.length === 0} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 px-6 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  تصدير إلى Excel
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                 <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-white/80 text-sm">عدد المعاملات اليوم</p>
                       <p className="text-3xl font-black mt-1">{dailyRecords.length}</p>
                     </div>
                     <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                       <FileText className="w-6 h-6" />
                     </div>
                   </div>
                 </Card>
                 <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-white/80 text-sm">إجمالي المباع (دولار)</p>
                       <p className="text-2xl font-black mt-1">
                         {dailyRecords.reduce((acc, r) => acc + (r.amountForeign || 0), 0).toLocaleString()} $
                       </p>
                     </div>
                     <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                       <DollarSign className="w-6 h-6" />
                     </div>
                   </div>
                 </Card>
                 <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-waha-gold to-yellow-600 text-white">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-white/90 text-sm">إجمالي المستلم (دينار)</p>
                       <p className="text-2xl font-black mt-1">
                         {dailyRecords.reduce((acc, r) => acc + (r.amountLocal || 0), 0).toLocaleString()} د.ل
                       </p>
                     </div>
                     <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                       <DollarSign className="w-6 h-6" />
                     </div>
                   </div>
                 </Card>
              </div>

              {/* Table */}
              <Card className="border-0 shadow-card bg-white rounded-[1rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right" dir="rtl">
                    <thead>
                      <tr className="border-b border-waha-gray-100 bg-waha-gray-50/50">
                        <th className="text-[11px] font-black text-waha-gray-400 px-4 py-3">رقم العملية</th>
                        <th className="text-[11px] font-black text-waha-gray-400 px-4 py-3">اسم العميل</th>
                        <th className="text-[11px] font-black text-waha-gray-400 px-4 py-3">الرقم الوطني</th>
                        <th className="text-[11px] font-black text-waha-gray-400 px-4 py-3">القيمة (دولار)</th>
                        <th className="text-[11px] font-black text-waha-gray-400 px-4 py-3">الإيصال</th>
                        <th className="text-[11px] font-black text-waha-gray-400 px-4 py-3">وقت التنفيذ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-waha-gold" /></td>
                        </tr>
                      ) : dailyRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-sm text-gray-400">لا توجد سجلات لهذا اليوم</td>
                        </tr>
                      ) : dailyRecords.map((r) => (
                        <tr key={r.id} className="border-b border-waha-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-[11px] font-mono text-gray-500">{r.transactionNumber}</td>
                          <td className="px-4 py-3 text-xs font-bold">{r.customerName}</td>
                          <td className="px-4 py-3 text-xs">{r.nationalId}</td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-600">{r.amountForeign?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.receiptNumber}</td>
                          <td className="px-4 py-3 text-[11px] text-gray-500">{new Date(r.executedAt).toLocaleTimeString('ar-LY')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="mt-4">
            <Card className="border-0 shadow-card bg-white rounded-[2rem] overflow-hidden">
              {/* Filter Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-waha-gray-100 bg-waha-gray-50/50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-waha-gold" />
                  <span className="text-sm font-black text-waha-gray-900">سجل الأحداث والتدقيق</span>
                  {auditMeta?.total != null && (
                    <Badge variant="outline" className="text-[9px] font-bold border-waha-gray-200 text-waha-gray-500">
                      {auditMeta.total} حدث
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setAuditPage(1) }}>
                    <SelectTrigger className="h-8 text-xs border-waha-gray-200 bg-white rounded-xl focus:ring-waha-gold w-48">
                      <SelectValue placeholder="كل الأحداث" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-waha-gray-200">
                      <SelectItem value="All">كل الأحداث</SelectItem>
                      {Object.entries(actionLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl" onClick={fetchAuditLogs}>
                    تحديث
                  </Button>
                </div>
              </div>

              {/* Log Table */}
              <div className="relative min-h-[300px]">
                {auditLoading && (
                  <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-waha-gold" />
                  </div>
                )}

                {!auditLoading && auditLogs.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-waha-gray-300">
                    <Shield className="w-12 h-12 mb-3" />
                    <p className="text-sm font-bold">لا توجد أحداث مسجلة</p>
                  </div>
                ) : (
                  <table className="w-full text-right" dir="rtl">
                    <thead>
                      <tr className="border-b border-waha-gray-100 bg-waha-gray-50/50">
                        <th className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider px-4 py-3">الحدث</th>
                        <th className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider px-4 py-3">نوع الكيان</th>
                        <th className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider px-4 py-3">معرف الكيان</th>
                        <th className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider px-4 py-3">المستخدم</th>
                        <th className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider px-4 py-3">عنوان IP</th>
                        <th className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider px-4 py-3">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-waha-gray-50 hover:bg-waha-gray-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${actionColors[log.action] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {actionLabels[log.action] ?? log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[11px] font-bold text-waha-gray-700">{log.entityType}</td>
                          <td className="px-4 py-3 text-[10px] font-mono text-waha-gray-500 max-w-[120px] truncate">{log.entityId}</td>
                          <td className="px-4 py-3 text-[11px] font-bold text-waha-gray-700">{log.performedByUserId ?? "—"}</td>
                          <td className="px-4 py-3 text-[10px] font-mono text-waha-gray-400" dir="ltr">{log.ipAddress ?? "—"}</td>
                          <td className="px-4 py-3 text-[10px] text-waha-gray-500 font-medium">{formatDate(log.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {auditMeta && auditMeta.last_page > 1 && (
                <div className="flex flex-row-reverse items-center justify-between px-6 py-4 bg-waha-gray-50/50 border-t border-waha-gray-100">
                  <span className="text-xs font-bold text-waha-gray-400">
                    الصفحة <span className="text-waha-gray-900">{auditMeta.page}</span> من <span className="text-waha-gray-900">{auditMeta.last_page}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-waha-gray-200 hover:bg-waha-gold hover:border-waha-gold hover:text-waha-gray-900 font-bold"
                      onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1 || auditLoading}>
                      <ChevronRight className="w-4 h-4 ml-1" /> السابق
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-waha-gray-200 hover:bg-waha-gold hover:border-waha-gold hover:text-waha-gray-900 font-bold"
                      onClick={() => setAuditPage(p => Math.min(auditMeta.last_page, p + 1))} disabled={auditPage === auditMeta.last_page || auditLoading}>
                      التالي <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

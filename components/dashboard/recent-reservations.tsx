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
import { Loader2, FileText, ArrowLeft } from "lucide-react"
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

export function RecentReservations() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alwaha_auth_token") : ""
      const headers: any = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const query = new URLSearchParams()
      query.append("limit", "5")
      query.append("page", "1")

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
        setData([])
        setLoading(false)
        return
      }

      if (json && json.data && Array.isArray(json.data)) {
        setData(json.data.slice(0, 5))
      } else {
        setData([])
      }
    } catch (e) {
      console.error("Error fetching purchase requests:", e)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getCurrencyIcon = (code: string) => {
    if (!code) return "$"
    if (code.includes("USD")) return "$"
    if (code.includes("EUR")) return "€"
    if (code.includes("GBP")) return "£"
    return "$"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString("ar-LY", { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <Card className="w-full flex flex-col border-0 shadow-card bg-white rounded-3xl overflow-hidden col-span-1 lg:col-span-3">
      <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-waha-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-waha-gold rounded-full" />
          <CardTitle className="text-sm font-bold text-waha-gray-900">آخر 5 حجوزات</CardTitle>
        </div>
        <Button variant="ghost" className="text-waha-gold hover:text-waha-gold-dark hover:bg-waha-gold/10 font-bold text-[10px] h-7 gap-1 px-3" asChild>
          <Link href="/reservations">
            عرض الكل
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full relative min-h-[150px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-waha-gold" />
            </div>
          )}

          {data.length === 0 && !loading && (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium text-xs">لا توجد حجوزات حديثة</p>
            </div>
          )}

          {data.length > 0 && (
            <Table dir="rtl">
              <TableHeader>
                <TableRow className="border-y border-waha-gray-100 hover:bg-transparent">
                  <TableHead className="text-right text-[9px] font-bold text-waha-gray-400 h-8 px-4 uppercase tracking-wider">العميل</TableHead>
                  <TableHead className="text-right text-[9px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">المرجع</TableHead>
                  <TableHead className="text-right text-[9px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">تاريخ الطلب</TableHead>
                  <TableHead className="text-right text-[9px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">القيمة (د.ل)</TableHead>
                  <TableHead className="text-right text-[9px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">الحالة</TableHead>
                  <TableHead className="text-center text-[9px] font-bold text-waha-gray-400 h-8 uppercase tracking-wider">الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((req, index) => {
                  const u = req?.bankAccount?.user || {};
                  const customerName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || req.user_name || "بدون اسم";
                  const currencyCode = req.contract?.currency_code || "USD";
                  const stateStr = typeof req.state === "object" ? req.state?.code || "pending" : (req.state || "pending");
                  const mappedState = statusConfig[stateStr.toLowerCase()] || statusConfig.fallback;

                  return (
                    <TableRow key={req.uuid || index} className="group hover:bg-waha-gray-50/50 border-b-waha-gray-50 transition-all duration-300">
                      <TableCell className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-waha-gray-50 group-hover:bg-white flex items-center justify-center text-waha-gold font-bold text-[10px] border border-transparent group-hover:border-waha-gold/20 transition-all shadow-sm">
                            {getCurrencyIcon(currencyCode)}
                          </div>
                          <span className="font-bold text-[11px] text-waha-gray-900">{customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-[10px] font-mono text-waha-gray-500 bg-waha-gray-50 px-1.5 py-0.5 rounded">{req.reference || "—"}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-[10px] text-waha-gray-500 font-medium">{formatDate(req.created_at)}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-[11px] font-extrabold text-emerald-600">
                          {(parseInt(req.amount_requested || "0") * (req.contract?.bank_transfer_price || 4.85)).toLocaleString()} د.ل
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`${mappedState.color} font-bold text-[8px] px-1.5 py-0 rounded-full border`}>
                          {mappedState.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Button size="sm" className="h-6 px-3 rounded-md bg-waha-gray-900 hover:bg-black text-white font-bold text-[9px] shadow-sm transition-all group-hover:scale-105" asChild>
                          <Link href={`/execute?id=${req.uuid}`}>تنفيذ</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

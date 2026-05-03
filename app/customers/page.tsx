"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Search, Plus, Filter, MoreHorizontal, User, Phone, Mail, Calendar, Loader2, CheckCircle2, RefreshCcw } from "lucide-react"
import { AddReservationDialog } from "@/components/dashboard/add-reservation-dialog"
import { CustomerDetailDialog } from "@/components/dashboard/customer-detail-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "نشط", variant: "default" },
  inactive: { label: "غير نشط", variant: "secondary" },
  blocked: { label: "محظور", variant: "destructive" },
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [executionSessions, setExecutionSessions] = useState<any[]>([])

  // Dialog States
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isResDialogOpen, setIsResDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/customers")
      if (!res.ok) throw new Error("Failed to fetch customers")
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error(err)
      toast.error("خطأ في تحميل بيانات العملاء")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchExecutionSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/execution-sessions")

      if (!res.ok) {
        throw new Error("Failed to fetch execution sessions")
      }

      const data = await res.json()
      setExecutionSessions(data.sessions || [])
    } catch (err) {
      console.error(err)
      toast.error("خطأ في تحميل سجل التنفيذ")
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
    fetchExecutionSessions()
  }, [fetchCustomers, fetchExecutionSessions])

  const filteredCustomers = customers.filter(c =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.nationalId || "").includes(searchQuery)
  )

  const openReservation = (customer: any) => {
    setSelectedCustomer(customer)
    setIsResDialogOpen(true)
  }

  const openDetails = (customer: any) => {
    setSelectedCustomer(customer)
    setIsDetailOpen(true)
  }

  const getCustomerSessions = (customer: any) => {
    return executionSessions.filter((session) => {
      const sameNid =
        session.customerNid &&
        customer.nationalId &&
        session.customerNid === customer.nationalId

      const samePhone =
        session.customerPhone &&
        customer.phone &&
        session.customerPhone === customer.phone

      return sameNid || samePhone
    })
  }

  return (
    <DashboardLayout title="العملاء" breadcrumb="إدارة العملاء">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-waha-gold rounded-full" />
            <h1 className="text-2xl font-black text-waha-gray-900">سجل العملاء المعتمدين</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-waha-gray-400" />
              <Input
                placeholder="ابحث بالاسم أو الرقم الوطني..."
                className="pr-10 h-11 rounded-xl border-waha-gray-200 bg-white shadow-sm focus:ring-waha-gold focus:border-waha-gold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="h-11 px-6 bg-waha-gray-900 hover:bg-black text-white font-bold rounded-xl gap-2 shadow-lg shadow-black/5">
              <RefreshCcw className="w-4 h-4 text-waha-gold" />
              مزامنة البيانات
            </Button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SummaryCard 
            label="إجمالي العملاء" 
            value={customers.length.toString()} 
            icon={User} 
            color="waha-gold" 
          />
          <SummaryCard 
            label="العملاء النشطون" 
            value={customers.filter(c => c.status === "active").length.toString()} 
            icon={CheckCircle2} 
            color="emerald-500" 
          />
          <SummaryCard 
            label="حجوزات اليوم" 
            value="12" 
            icon={Calendar} 
            color="blue-500" 
          />
          <SummaryCard 
            label="حسابات محظورة" 
            value={customers.filter(c => c.status === "blocked").length.toString()} 
            icon={User} 
            color="red-500" 
          />
        </div>

        {/* Main Content Table Card */}
        <Card className="border-0 shadow-card bg-white rounded-[2rem] overflow-hidden">
          <div className="relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-waha-gold" />
              </div>
            )}

            {!loading && filteredCustomers.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-waha-gray-50 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-waha-gray-200" />
                </div>
                <p className="text-waha-gray-400 font-bold">لا يوجد عملاء في السجل حالياً</p>
              </div>
            )}

            {filteredCustomers.length > 0 && (
              <Table dir="rtl">
                <TableHeader>
                  <TableRow className="border-y border-waha-gray-100 hover:bg-transparent">
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 px-8 uppercase tracking-wider">العميل</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 uppercase tracking-wider">الرقم الوطني</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 uppercase tracking-wider">رقم الهاتف</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 uppercase tracking-wider">عمليات التنفيذ</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 uppercase tracking-wider">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 uppercase tracking-wider">الحالة</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-waha-gray-400 h-12 uppercase tracking-wider">تاريخ الإضافة</TableHead>
                    <TableHead className="text-center w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const customerSessions = getCustomerSessions(customer)
                    const latestSession = customerSessions[0]

                    return (
                    <TableRow key={customer.id} className="group hover:bg-waha-gray-50/50 border-b-waha-gray-50 transition-all duration-300 cursor-pointer" onClick={() => openDetails(customer)}>
                      <TableCell className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-waha-gray-50 group-hover:bg-white flex items-center justify-center text-waha-gold font-black text-lg border border-transparent group-hover:border-waha-gold/20 transition-all shadow-sm">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-waha-gray-900">{customer.name}</span>
                            <span className="text-[11px] text-waha-gray-400 mt-0.5">عميل معتمد</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="text-xs font-mono text-waha-gray-500 bg-waha-gray-50 px-2 py-1 rounded-md">{customer.nationalId}</span>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-waha-gray-700">
                          <Phone className="w-3.5 h-3.5 text-waha-gray-300" />
                          <span dir="ltr">{customer.phone || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5" onClick={(e) => e.stopPropagation()}>
                        {customerSessions.length === 0 ? (
                          <span className="text-xs text-waha-gray-400">لا توجد</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-bold"
                            onClick={() => window.location.href = `/execute?id=${latestSession.id}`}
                          >
                            {customerSessions.length} عملية - {latestSession.status}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2 text-xs font-medium text-waha-gray-500">
                          <Mail className="w-3.5 h-3.5 text-waha-gray-300" />
                          <span>{customer.email || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant={statusMap[customer.status || "active"].variant} className="text-[10px] px-3 py-1 rounded-full border-2 font-bold uppercase tracking-wider">
                          {statusMap[customer.status || "active"].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col">
                          <span className="text-xs text-waha-gray-900 font-bold">{new Date(customer.createdAt).toLocaleDateString("ar-LY", { day: '2-digit', month: 'short' })}</span>
                          <span className="text-[10px] text-waha-gray-400 font-medium">{new Date(customer.createdAt).getFullYear()}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="py-5 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-waha-gray-100">
                              <MoreHorizontal className="w-5 h-5 text-waha-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-waha-gray-200 shadow-xl">
                            <DropdownMenuItem className="gap-3 h-11 rounded-xl cursor-pointer font-bold text-xs" onClick={() => openReservation(customer)}>
                              <Plus className="w-4 h-4 text-waha-gold" />
                              تسجيل حجز جديد
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-waha-gray-100" />
                            <DropdownMenuItem className="gap-3 h-11 rounded-xl cursor-pointer font-bold text-xs" onClick={() => openDetails(customer)}>
                              <User className="w-4 h-4 text-waha-gray-400" />
                              عرض ملف العميل
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 h-11 rounded-xl cursor-pointer font-bold text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                              <User className="w-4 h-4" />
                              حظر العميل
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <AddReservationDialog
        open={isResDialogOpen}
        onOpenChange={setIsResDialogOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      <CustomerDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        customerId={selectedCustomer?.id}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <Card className="border-0 shadow-premium bg-white rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className={`absolute right-0 top-0 w-1.5 h-full bg-${color}`} />
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl bg-${color}/10 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform`}>
          <Icon className={`w-7 h-7 text-${color}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className="text-2xl font-black text-slate-900 mt-1">{value}</span>
        </div>
      </div>
    </Card>
  )
}

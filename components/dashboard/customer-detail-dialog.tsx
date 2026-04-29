"use client"

import { useState, useEffect } from "react"
import { 
  History, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Loader2, 
  Maximize2,
  User,
  Phone,
  Mail,
  Info,
  MapPin,
  CreditCard,
  FileText,
  DollarSign,
  Trash2,
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn, getMediaUrl } from "@/lib/utils"
import Link from "next/link"

interface CustomerDetailDialogProps {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailDialog({ customerId, open, onOpenChange }: CustomerDetailDialogProps) {
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (customerId && open) {
      setLoading(true)
      fetch(`/api/customers/${customerId}`)
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message || "فشل تحميل بيانات العميل")
          }
          return res.json()
        })
        .then(data => {
          setCustomer(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          toast.error(err.message)
          setLoading(false)
          onOpenChange(false)
        })
    } else if (!open) {
      setCustomer(null)
    }
  }, [customerId, open, onOpenChange])

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("ar-LY", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المرفق؟")) return
    try {
      const res = await fetch(`/api/media/delete/${mediaId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("فشل الحذف")
      toast.success("تم حذف المرفق")
      // Refresh customer data
      onOpenChange(false)
      setTimeout(() => onOpenChange(true), 100)
    } catch (err) {
      toast.error("حدث خطأ أثناء الحذف")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background" dir="rtl">
        <DialogHeader className={cn(
          "p-6 border-b border-waha-gray-200 transition-colors duration-300",
          customer ? "bg-waha-gray-900 text-white" : "bg-muted animate-pulse"
        )}>
          <div className="flex items-center gap-5">
             <div className="w-16 h-16 rounded-2xl bg-waha-gold flex items-center justify-center text-waha-gray-900 text-2xl font-black shadow-lg shrink-0">
               {customer?.name?.charAt(0) || <User className="w-8 h-8" />}
             </div>
             <div className="text-right">
                <DialogTitle className="text-2xl font-black font-sans tracking-tight leading-none mb-1">
                  {customer?.name || "جاري التحميل..."}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-waha-gold text-waha-gray-900 border-none font-bold text-[10px] uppercase tracking-widest px-2">عميل نشط</Badge>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{customer ? `Ref: ${customer.id.split('-')[0]}` : ""}</p>
                </div>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-visible bg-white">
          {loading || !customer ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-waha-gold" />
              <p className="text-xs text-waha-gray-400 font-bold uppercase tracking-widest animate-pulse">Fetching Data...</p>
            </div>
          ) : (
            <Tabs defaultValue="info" className="w-full flex flex-col h-full">
              <div className="px-6 border-b border-waha-gray-100 bg-waha-gray-50/50">
                <TabsList className="w-full h-12 bg-transparent gap-6 p-0 border-none">
                  <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:text-waha-gray-900 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-waha-gold rounded-none h-12 px-0 text-xs font-bold text-waha-gray-400 gap-2">
                    <Info className="w-3.5 h-3.5" />
                    البيانات الأساسية
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:text-waha-gray-900 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-waha-gold rounded-none h-12 px-0 text-xs font-bold text-waha-gray-400 gap-2">
                    <History className="w-3.5 h-3.5" />
                    سجل الحجوزات
                  </TabsTrigger>
                  <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:text-waha-gray-900 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-waha-gold rounded-none h-12 px-0 text-xs font-bold text-waha-gray-400 gap-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    المرفقات الرقمية
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 overflow-y-auto max-h-[55vh]">
                <TabsContent value="info" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <DataCard label="الرقم الوطني" value={customer.nationalId} icon={<User className="w-4 h-4" />} />
                    <DataCard label="رقم الهاتف" value={customer.phone} icon={<Phone className="w-4 h-4" />} />
                    <DataCard label="رقم الجواز" value={customer.passportNumber || "—"} icon={<CreditCard className="w-4 h-4" />} />
                    <DataCard label="العنوان / الفرع" value={customer.address || "—"} icon={<MapPin className="w-4 h-4" />} />
                  </div>
                  <div className="p-4 bg-waha-gray-900 border border-waha-gray-200 rounded-2xl text-white">
                     <p className="text-[10px] font-black text-waha-gold uppercase tracking-[0.2em] mb-1">Status Summary</p>
                     <p className="text-sm font-bold opacity-90 leading-relaxed font-sans">هذا العميل في حالة جيدة ومؤهل لإجراء عمليات صرف العملات الأجنبية وفقاً لسياسة المصرف.</p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {customer.reservations?.length === 0 ? (
                    <EmptyState message="لا توجد حجوزات سابقة لهذا العميل" />
                  ) : (
                    customer.reservations?.map((res: any) => (
                      <Card key={res.id} className="p-6 bg-white border border-waha-gray-100 shadow-sm space-y-6 group hover:border-waha-gold transition-all rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-waha-gold opacity-20" />
                        
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-waha-gray-50 rounded-xl text-waha-gold">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest">رقم الحجز</p>
                                 <p className="text-xs font-black text-waha-gray-900">{res.reservationNumber}</p>
                              </div>
                           </div>
                           <Badge className={cn(
                             "text-[9px] font-black h-6 px-3 uppercase tracking-widest rounded-full",
                             res.status === "pending" ? "bg-waha-gold/10 text-waha-gold-dark" : "bg-emerald-50 text-emerald-600"
                           )}>
                             {res.status === "pending" ? "قيد التنفيذ" : "مكتمل"}
                           </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-waha-gray-50">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest mb-1">المبلغ المطلوب صرفه</p>
                              <p className="text-2xl font-black text-waha-gray-900">{res.amountRequested.toLocaleString()} <span className="text-waha-gold">{res.currencyCode}</span></p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest mb-1">المعادل بالدينار</p>
                              <p className="text-lg font-black text-waha-gray-700">{res.equivalentLyd?.toLocaleString()} <span className="text-waha-gray-400">د.ل</span></p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-waha-gray-50">
                           <p className="text-[10px] font-bold text-waha-gray-400">{formatDate(res.createdAt)}</p>
                           <Button variant="ghost" className="h-8 text-[10px] font-black text-waha-gold gap-1.5 hover:bg-waha-gold/5" asChild>
                              <Link href={`/execute?id=${res.uuid}&step=6`}>
                                 <DollarSign className="w-3 h-3" />
                                 عرض تفاصيل الإيصال
                              </Link>
                           </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="media" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-8">
                    {customer.reservations?.filter((r: any) => r.media?.length > 0).length === 0 ? (
                      <EmptyState message="لم يتم التقاط أي وسائط لهذا العميل بعد" />
                    ) : (
                      customer.reservations?.filter((r: any) => r.media?.length > 0).map((res: any) => (
                        <div key={res.id} className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-waha-gold" />
                              <h4 className="text-sm font-black text-waha-gray-900">عملية {res.reference || res.id.substring(0, 8)}</h4>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-waha-gray-100 text-waha-gray-400 bg-waha-gray-50/50">
                              {formatDate(res.createdAt)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            {res.media.map((m: any) => {
                              const mediaUrl = `${getMediaUrl(m)}?t=${Date.now()}`
                              return (
                                <div key={m.id} className="group relative aspect-square rounded-xl overflow-hidden border border-waha-gray-100 bg-waha-gray-50 shadow-sm hover:shadow-md transition-all">
                                  {m.type === "PHOTO" || m.type === "DOCUMENT" ? (
                                    <img src={mediaUrl} alt="Capture" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-waha-gray-400 bg-waha-gray-100 gap-2">
                                      <video src={mediaUrl} className="w-full h-full object-cover" muted />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-waha-gray-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-waha-gold text-waha-gold bg-transparent hover:bg-waha-gold hover:text-waha-gray-900 transition-all" asChild>
                                      <a href={mediaUrl} download target="_blank" rel="noreferrer">
                                        <Maximize2 className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500 border-none text-white transition-all"
                                    onClick={() => handleDeleteMedia(m.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        <div className="p-4 border-t border-waha-gray-100 bg-waha-gray-50 flex items-center justify-between">
           <p className="text-[9px] text-waha-gray-400 font-bold uppercase tracking-widest">Waha Bank System v2.0</p>
           <p className="text-[10px] text-waha-gray-400 font-bold">تاريخ الانضمام: {formatDate(customer?.createdAt)}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DataCard({ label, value, icon, fullWidth }: { label: string; value: string; icon: any; fullWidth?: boolean }) {
  return (
    <Card className={cn("p-4 border-waha-gray-100 shadow-none bg-waha-gray-50/50", fullWidth && "col-span-2")}>
       <p className="text-[9px] font-black text-waha-gray-400 uppercase tracking-widest mb-1">{label}</p>
       <div className="flex items-center gap-2">
         <div className="text-waha-gold-dark">{icon}</div>
         <span className="text-sm font-bold text-waha-gray-900 truncate">{value || "—"}</span>
       </div>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border-2 border-dashed border-waha-gray-100">
       <Info className="w-8 h-8 text-waha-gray-200 mb-2" />
       <p className="text-xs text-waha-gray-400 font-bold uppercase tracking-tight">{message}</p>
    </div>
  )
}

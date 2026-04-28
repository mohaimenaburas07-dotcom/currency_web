"use client"

import { Button } from "@/components/ui/button"
import { X, Printer, Copy, PenTool, Fingerprint } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReceiptPreviewProps {
  customer: {
    name: string
    nationalId: string
    passport: string
    phone: string
  }
  operation: {
    id: string
    currency: string
    amount: string
    rate: string
    totalLYD: string
  }
  denominations: { value: number; count: number; total: number }[]
  serialNumber: string
  onClose?: () => void
  isEmbed?: boolean
}

export function ReceiptPreview({
  customer,
  operation,
  denominations,
  serialNumber,
  onClose,
  isEmbed = false,
}: ReceiptPreviewProps) {
  const currentDate = new Date().toLocaleDateString("ar-LY")
  const currentTime = new Date().toLocaleTimeString("ar-LY", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    /* Backdrop — z-[200] to sit above sidebar (z-40) and topbar (z-30) */
    <div
      className={cn(
        isEmbed ? "w-full" : "fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      )}
      onClick={(e) => !isEmbed && e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={cn(
          "bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden",
          isEmbed ? "w-full border border-waha-gray-100 shadow-sm" : ""
        )}
        style={!isEmbed ? { width: "min(900px, calc(100vw - 13rem - 3rem))", maxHeight: "90vh" } : {}}
        dir="rtl"
      >
        {/* ── Modal Header — hidden during print ── */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-waha-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-waha-gold flex items-center justify-center shrink-0">
              <span className="text-waha-gray-900 font-black text-base">و</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-waha-gray-900">معاينة الإيصال</h2>
              <p className="text-[10px] text-waha-gray-400 font-medium">{currentDate} — {currentTime}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-waha-gray-50" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Grid Body — scrollable ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Print-only Header ── */}
          <div className="print-only mb-6 border-b border-waha-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-waha-gold flex items-center justify-center shrink-0 print-exact-bg">
                  <span className="text-waha-gray-900 font-black text-xl">و</span>
                </div>
                <div>
                  <h1 className="text-xl font-black text-waha-gray-900">مصرف الواحة</h1>
                  <p className="text-xs font-bold text-waha-gray-500">إيصال صرف عملة أجنبية للأغراض الشخصية</p>
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <p className="text-[10px] font-bold text-waha-gray-400 mb-1.5">{currentDate} {currentTime}</p>
                <div className="inline-block px-3 py-1 rounded-lg border-2 border-waha-gray-900 font-black text-xs text-waha-gray-900 print-copy-type-label">
                  {/* Content injected via CSS based on data attribute */}
                </div>
              </div>
            </div>
          </div>

          {/* Operation ID strip — full width */}
          <div className="flex items-stretch gap-4 p-4 bg-waha-gray-900 rounded-2xl mb-5">
            <div className="flex-1">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">رقم العملية</p>
              <p className="text-sm font-black text-waha-gold font-mono">{operation.id}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex-1 text-left" dir="ltr">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Serial Number</p>
              <p className="text-xs font-mono font-bold text-white/80">{serialNumber}</p>
            </div>
          </div>

          {/* Two-column grid — explicit ltr so columns go right→left visually correct in RTL page */}
          <div className="grid grid-cols-2 gap-4">

            {/* ── RIGHT column (first in RTL — visually on the right) ── */}
            <div className="space-y-4">
              {/* Customer Info */}
              <Section title="بيانات العميل">
                <ReceiptRow label="الاسم الكامل" value={customer.name} />
                <ReceiptRow label="رقم الهوية" value={customer.nationalId} />
                <ReceiptRow label="رقم الجواز" value={customer.passport} />
                <ReceiptRow label="رقم الهاتف" value={customer.phone} isLtr />
              </Section>

              {/* Signatures & Fingerprints */}
              <Section title="التوقيعات والبصمة">
                <div className="grid grid-cols-2 gap-6">
                  {/* Customer Column */}
                  <div className="space-y-4">
                    <p className="text-[10px] text-waha-gray-400 font-bold text-center border-b border-waha-gray-100 pb-1">العميل</p>
                    <div className="text-center">
                      <div className="h-16 bg-waha-gray-50 rounded-xl border-2 border-dashed border-waha-gray-200 mb-1.5 flex items-center justify-center">
                         <PenTool className="w-4 h-4 text-waha-gray-300" />
                      </div>
                      <p className="text-[9px] text-waha-gray-400 font-bold uppercase tracking-wider">توقيع العميل</p>
                    </div>
                    <div className="text-center">
                      <div className="h-20 bg-waha-gray-50 rounded-xl border-2 border-dashed border-waha-gray-200 mb-1.5 flex items-center justify-center">
                         <Fingerprint className="w-8 h-8 text-waha-gray-300" />
                      </div>
                      <p className="text-[9px] text-waha-gray-400 font-bold uppercase tracking-wider">بصمة العميل</p>
                    </div>
                  </div>

                  {/* Operator Column */}
                  <div className="space-y-4">
                    <p className="text-[10px] text-waha-gray-400 font-bold text-center border-b border-waha-gray-100 pb-1">الموظف</p>
                    <div className="text-center">
                      <div className="h-16 bg-waha-gray-50 rounded-xl border-2 border-dashed border-waha-gray-200 mb-1.5 flex items-center justify-center">
                         <PenTool className="w-4 h-4 text-waha-gray-300" />
                      </div>
                      <p className="text-[9px] text-waha-gray-400 font-bold uppercase tracking-wider">توقيع الموظف</p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Staff Info */}
              <Section title="بيانات التنفيذ">
                <ReceiptRow label="منفذ العملية" value="أحمد محمد" />
                <ReceiptRow label="أمين الصندوق" value="علي إبراهيم" />
                <ReceiptRow label="الفرع" value="طرابلس - المركز الرئيسي" />
              </Section>

              {/* Footer */}
              <div className="text-center pt-2">
                <p className="text-[9px] text-waha-gray-300 leading-relaxed">
                  هذا الإيصال صادر آليًا من نظام مصرف الواحة لإدارة عمليات الصرف
                </p>
                <p className="text-[9px] text-waha-gray-300 mt-0.5">
                  021-1234567 | info@alwaha-bank.ly
                </p>
              </div>
            </div>

            {/* ── LEFT column (second in RTL — visually on the left) ── */}
            <div className="space-y-4">
              {/* Operation Details */}
              <Section title="تفاصيل العملية">
                <ReceiptRow label="نوع العملة" value={operation.currency} />
                <ReceiptRow label="المبلغ" value={operation.amount} />
                <ReceiptRow label="سعر الصرف" value={operation.rate} />
              </Section>

              {/* Denominations */}
              <Section
                title="الفئات النقدية"
                badge={denominations.length > 0 ? `${denominations.length} فئة` : undefined}
              >
                {/* header row */}
                <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-bold text-waha-gray-400 uppercase mb-1.5">
                  <span>الفئة</span>
                  <span>العدد</span>
                  <span>المجموع</span>
                </div>
                {denominations.length > 0 ? (
                  <div className="space-y-1">
                    {denominations.map((denom) => (
                      <div
                        key={denom.value}
                        className="grid grid-cols-3 gap-1 text-center text-[11px] py-2 px-2 rounded-xl bg-waha-gray-50 border border-waha-gray-100"
                      >
                        <span className="font-black text-waha-gold">${denom.value}</span>
                        <span className="font-bold text-waha-gray-700">{denom.count}</span>
                        <span className="font-black text-waha-gray-900">${denom.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-[10px] text-waha-gray-300 font-bold">
                    لا توجد فئات مسجلة
                  </div>
                )}
              </Section>

              {/* Total Hero */}
              <div className="bg-gradient-to-l from-amber-400 to-yellow-300 rounded-2xl p-5">
                <p className="text-[9px] font-bold text-yellow-900/60 uppercase tracking-widest mb-1">الإجمالي بالدينار الليبي</p>
                <p className="text-3xl font-black text-yellow-900">
                  {operation.totalLYD} <span className="text-xl font-bold">د.ل</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions Footer — hidden during print ── */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-t border-waha-gray-100 bg-waha-gray-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs rounded-xl border-waha-gray-200 font-bold">
              <Copy className="w-3.5 h-3.5" /> نسخة الأرشيف
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs rounded-xl border-waha-gray-200 font-bold">
              <Copy className="w-3.5 h-3.5" /> نسخة العميل
            </Button>
          </div>
          <Button size="sm" className="h-9 gap-2 text-xs rounded-xl bg-waha-gold hover:bg-waha-gold/90 text-waha-gray-900 font-bold shadow-md shadow-waha-gold/20">
            <Printer className="w-3.5 h-3.5" /> طباعة الإيصال
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Reusable card section with header */
function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-waha-gray-50 rounded-2xl border border-waha-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-waha-gray-100 bg-white">
        <h3 className="text-xs font-black text-waha-gray-900">{title}</h3>
        {badge && <span className="text-[9px] font-bold text-waha-gray-400">{badge}</span>}
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  )
}

function ReceiptRow({
  label,
  value,
  isLtr,
}: {
  label: string
  value: string
  isLtr?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-waha-gray-400 text-[10px] font-bold shrink-0">{label}</span>
      <span className="font-bold text-[11px] text-waha-gray-900 text-left truncate" dir={isLtr ? "ltr" : "rtl"}>
        {value}
      </span>
    </div>
  )
}

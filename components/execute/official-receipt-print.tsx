"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PrintReceiptProps {
  session: any
  cbsData?: any
}

function convertAmountToWords(amount: number, currency: string) {
  // Simple fallback logic since we don't have a full converter handy here.
  // Ideally this would come from the backend.
  return `${amount} ${currency} Only`
}

export function OfficialReceiptPrint({ session, cbsData }: PrintReceiptProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Add a slight delay to ensure fonts and styles are loaded
    const timeout = setTimeout(() => {
      window.print()
    }, 500)
    return () => clearTimeout(timeout)
  }, [])

  if (!mounted) return null

  // Extract data safely
  const req = session.requestSnapshot || {}
  const customerName = cbsData?.customerName || req.customer?.fullName || req.customerName || ""
  const nationalId = cbsData?.nationalId || req.customer?.nationalId || req.customerNationalId || ""
  const passport = cbsData?.passportNo || req.customer?.passportNumber || ""
  const phone = cbsData?.phoneNumber || req.customer?.phone || ""
  const iban = req.bankAccount?.iban || req.customer?.iban || req.accountNumber || cbsData?.iban || cbsData?.accountNumber || ""
  
  const currency = req.contract?.currency_code || "USD"
  const reqAmount = Number(req.amount_requested || session.cashCountResult?.totalCountedAmount || 0)
  const amount = reqAmount.toLocaleString()
  
  // exchange_rate may be a nested object { date, rate } or a plain number
  const rawRate = req.contract?.bank_transfer_price || req.exchange_rate || req.rate || req.exchangeRate || session.transactionRecord?.exchangeRate || 0
  const rate = typeof rawRate === 'object' && rawRate !== null ? Number(rawRate.rate || 0) : Number(rawRate)
  const totalLYD = (reqAmount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const amountWords = convertAmountToWords(reqAmount, currency)
  const fcmsRef = req.fcms_reference || session.id
  const branchName = cbsData?.branch || req.branch?.name_ar || "المركز الرئيسي"
  
  const serialNumber = session.transactionRecord?.serialNumber || ""
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  
  const denominations = session.cashCountResult?.denominations || []
  const banknoteSerials = session.cashCountResult?.usdSerialNumbers || []

  const renderCopy = (copyType: 'CUSTOMER' | 'ARCHIVE', label: string) => (
    <div className="receipt-copy flex flex-col w-[190mm] mx-auto bg-white" style={{ pageBreakInside: 'avoid' }}>
      
      {/* ── Top Label ── */}
      <div className="text-center font-bold text-[10px] text-gray-500 mb-2 border-b border-dashed border-gray-300 pb-1">
        {label}
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-2 w-1/2">
          <div>
            <h1 className="text-sm font-bold text-gray-800" dir="rtl">نموذج استلام نقدي (عملة أجنبية$)</h1>
            <h2 className="text-sm font-bold text-gray-700">Cash Withdrawal Form(USD)</h2>
          </div>
          <div className="flex items-end mt-2">
            <div className="w-64 border border-gray-400 h-8 flex items-center justify-between px-2 rounded-sm relative">
              <span className="text-xs font-bold w-full text-center">{branchName}</span>
              <span className="text-[10px] text-gray-500 absolute top-0 right-1 leading-none" dir="rtl">إسم الفرع<br/>Branch Name</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Alwaha Bank Logo" className="w-32 h-auto object-contain" />
        </div>
      </div>

      {/* ── Main Form Table ── */}
      <div className="border border-gray-400 rounded-sm flex flex-col text-[11px] leading-snug">
        
        {/* Row 1: Account Holder */}
        <div className="flex border-b border-gray-400 items-stretch h-8">
          <div className="w-48 px-2 flex items-center text-gray-600 border-r border-gray-400">Account Holder's Name</div>
          <div className="flex-1 px-2 flex items-center font-bold">{customerName}</div>
          <div className="w-32 px-2 flex items-center justify-end text-gray-600 border-l border-gray-400" dir="rtl">إسم صاحب الحساب</div>
        </div>

        {/* Row 2: Currency & IBAN */}
        <div className="flex border-b border-gray-400 items-stretch h-8">
          <div className="w-32 px-2 flex items-center text-gray-600 border-r border-gray-400">Currency Withdrawal</div>
          <div className="w-20 px-2 flex items-center font-bold justify-center">{currency}</div>
          <div className="w-24 px-2 flex items-center justify-end text-gray-600 border-x border-gray-400" dir="rtl">عملة السحب</div>
          
          <div className="w-24 px-2 flex items-center text-gray-600 border-r border-gray-400">IBAN Number</div>
          <div className="flex-1 flex items-center justify-center px-1">
            {/* IBAN characters left-to-right */}
            <div className="flex gap-[1px]" dir="ltr">
              {Array.from({ length: Math.max(iban.length, 24) }).map((_, i) => (
                <div key={i} className="w-3.5 h-5 border border-gray-400 flex items-center justify-center text-[9px] font-mono">
                  {iban[i] || ""}
                </div>
              ))}
            </div>
          </div>
          <div className="w-20 px-2 flex items-center justify-end text-gray-600 border-l border-gray-400" dir="rtl">رقم IBAN</div>
        </div>

        {/* Row 3: Amount & FCMS */}
        <div className="flex border-b border-gray-400 items-stretch h-8">
          <div className="w-32 px-2 flex items-center text-gray-600 border-r border-gray-400">Amount in Figures</div>
          <div className="w-32 px-2 flex items-center font-bold text-sm tracking-widest">{amount}</div>
          <div className="w-24 px-2 flex items-center justify-end text-gray-600 border-x border-gray-400" dir="rtl">المبلغ بالأرقام</div>
          
          <div className="w-32 px-2 flex items-center text-gray-600 border-r border-gray-400">FCMS Reference</div>
          <div className="flex-1 px-2 flex items-center font-bold font-mono text-[10px] tracking-wide">{fcmsRef}</div>
          <div className="w-24 px-2 flex items-center justify-end text-gray-600 border-l border-gray-400" dir="rtl">اشاري المعاملة</div>
        </div>

        {/* Row 3b: Amount in LYD */}
        <div className="flex border-b border-gray-400 items-stretch h-8 bg-gray-50/50">
          <div className="w-32 px-2 flex items-center text-gray-600 border-r border-gray-400">Equivalent in LYD</div>
          <div className="w-32 px-2 flex items-center font-bold text-sm tracking-widest">{totalLYD}</div>
          <div className="w-24 px-2 flex items-center justify-end text-gray-600 border-x border-gray-400" dir="rtl">المعادل بالدينار</div>
          
          <div className="w-32 px-2 flex items-center text-gray-600 border-r border-gray-400">Exchange Rate</div>
          <div className="flex-1 px-2 flex items-center font-bold font-mono tracking-wide">{rate}</div>
          <div className="w-24 px-2 flex items-center justify-end text-gray-600 border-l border-gray-400" dir="rtl">سعر الصرف</div>
        </div>

        {/* Row 4: ID / Passport / Phone */}
        <div className="flex border-b border-gray-400 items-stretch h-8">
          <div className="w-24 px-2 flex items-center text-gray-600 border-r border-gray-400">ID Number</div>
          <div className="w-32 px-2 flex items-center font-bold tracking-widest">{nationalId}</div>
          <div className="w-20 px-2 flex items-center justify-end text-gray-600 border-x border-gray-400" dir="rtl">الرقم الوطني</div>
          
          <div className="w-16 px-2 flex items-center text-gray-600 border-r border-gray-400">Passport</div>
          <div className="flex-1 px-2 flex items-center font-bold tracking-widest border-r border-gray-400">{passport}</div>
          
          <div className="w-16 px-2 flex items-center text-gray-600 border-r border-gray-400">Phone</div>
          <div className="flex-1 px-2 flex items-center font-bold tracking-widest border-r border-gray-400" dir="ltr">{phone}</div>
        </div>

        {/* Serial Number Row Removed */}

        {/* Row 6: Amount in Words */}
        <div className="flex border-b border-gray-400 items-stretch h-8">
          <div className="w-32 px-2 flex items-center text-gray-600 border-r border-gray-400">Amount in words</div>
          <div className="flex-1 px-2 flex items-center font-bold italic">{amountWords}</div>
          <div className="w-24 px-2 flex items-center justify-end text-gray-600 border-l border-gray-400" dir="rtl">المبلغ بالحروف</div>
        </div>

        {/* Banknote Serial Numbers List */}
        {banknoteSerials.length > 0 && (
          <div className="border-b border-gray-400 p-2 bg-gray-50/30">
            <div className="flex justify-between items-center mb-1 border-b border-gray-200 pb-0.5">
              <span className="text-[8px] font-bold text-gray-400 uppercase">Banknote Serial Numbers ({banknoteSerials.length})</span>
              <span className="text-[8px] font-bold text-gray-400" dir="rtl">الأرقام التسلسلية للعملات الورقية</span>
            </div>
            <div className="grid grid-cols-5 gap-y-0.5 gap-x-2 text-[8px] font-mono leading-tight">
              {banknoteSerials.map((sn: string, i: number) => (
                <div key={i} className="flex justify-between border-b border-gray-100/50">
                  <span className="opacity-40">{i+1}.</span>
                  <span className="font-bold">{sn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 7: Date & Signature */}
        <div className="flex items-stretch min-h-[3rem]">
          <div className="w-56 px-2 flex flex-col items-start justify-center text-gray-600 border-r border-gray-400 leading-tight">
            <span>Customer Signature</span>
            <span>& Fingerprint</span>
          </div>
          <div className="w-28 px-2 flex flex-col items-end justify-center text-gray-600 border-r border-gray-400 leading-tight" dir="rtl">
            <span>توقيع العميل</span>
            <span>والبصمة</span>
          </div>
          <div className="flex-1 px-2 flex items-center"></div>

          {/* Date Block */}
          <div className="w-52 flex flex-col items-center justify-center px-2 border-x border-gray-400">
            <div className="flex gap-1 items-center mb-1 text-[8px] text-gray-400 font-bold tracking-widest w-full px-1" dir="ltr">
              <span className="flex-1 text-center">D D</span>
              <span className="w-2"></span>
              <span className="flex-1 text-center">M M</span>
              <span className="w-2"></span>
              <span className="flex-[2] text-center">Y Y Y Y</span>
            </div>
            <div className="flex gap-1 items-center" dir="ltr">
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[0]}</div>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[1]}</div>
              <span className="text-gray-400 font-bold mx-0.5">/</span>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[3]}</div>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[4]}</div>
              <span className="text-gray-400 font-bold mx-0.5">/</span>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[6]}</div>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[7]}</div>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[8]}</div>
              <div className="w-4 h-5 border border-gray-400 text-[11px] font-bold flex items-center justify-center">{dateStr[9]}</div>
            </div>
          </div>
          <div className="w-16 px-2 flex flex-col justify-center items-end text-gray-600 leading-tight">
            <span>Date</span>
            <span dir="rtl">التاريخ</span>
          </div>
        </div>

      </div>

      {/* ── For Bank Use Only ── */}
      <div className="mt-2 border border-gray-400 rounded-sm flex flex-col text-[11px]">
        <div className="bg-gray-500 text-white flex justify-between px-2 py-1 font-bold print-exact-bg">
          <span>For Bank Use Only</span>
          <span dir="rtl">لاستعمال المصرف فقط</span>
        </div>
        <div className="flex items-stretch h-20">
          <div className="flex-1 border-r border-gray-400 flex flex-col items-center justify-end pb-2 relative">
            <span className="absolute top-2 right-2 text-gray-500 font-bold" dir="rtl">ختم المصرف<br/>Stamp</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-end pb-2 relative">
            <span className="absolute top-2 right-2 text-gray-500 font-bold" dir="rtl">توقيع الصراف<br/>Teller's Signature</span>
          </div>
        </div>
      </div>

    </div>
  )

  return (
    <div className="w-full flex flex-col items-center justify-start bg-white p-4 gap-12 min-h-screen">
      {/* Container simulating A4 page layout */}
      <div className="print-page print:m-0 print:p-0 flex flex-col gap-16">
        {renderCopy('CUSTOMER', 'نسخة العميل — Customer Copy')}
        
        {/* Scissor cut line */}
        <div className="w-full border-t-2 border-dashed border-gray-300 relative flex items-center justify-center print:border-gray-400 print-exact-border">
           <span className="bg-white px-2 text-gray-400 text-xs absolute">✂</span>
        </div>

        {renderCopy('ARCHIVE', 'نسخة الأرشيف — Archive Copy')}
      </div>
    </div>
  )
}

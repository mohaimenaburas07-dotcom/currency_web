"use client"

import React from "react"
import {
  Home, Calendar, PlayCircle, Users, FileText, LogOut,
  Search, Filter, CheckCircle, XCircle, Clock,
  FileCheck, Printer, Camera, UploadCloud, Banknote, Image as ImageIcon,
  Check, X, AlertTriangle, Fingerprint, PenTool, Edit3, CircleDashed, Scan, ArrowRight
} from "lucide-react"

// --- Reusable Mock Components for the Presentation Board --- //

const MockSidebar = () => (
  <div className="w-48 bg-[#1e1e20] text-gray-300 flex flex-col h-full shrink-0 border-l border-[#2d2d30] rounded-r-xl overflow-hidden relative z-10">
    <div className="p-4 flex flex-col items-center mb-4 mt-2">
      <div className="w-20 h-20 bg-[#2d2d30] rounded-full flex items-center justify-center mb-2">
         <span className="text-[#F9AE41] font-bold text-xl">م</span>
      </div>
      <div className="flex items-center gap-2 text-[#F9AE41] font-bold text-lg">
        <span>مصرف الواحة</span>
      </div>
    </div>
    <div className="px-3 flex-1 space-y-2">
      {[
        { i: Home, l: "الرئيسية", active: false },
        { i: Calendar, l: "الحجوزات", active: false },
        { i: PlayCircle, l: "تنفيذ العمليات", active: true },
        { i: Users, l: "العملاء", active: false },
        { i: FileText, l: "التقارير", active: false }
      ].map((n, idx) => (
        <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg transition-colors ${n.active ? 'bg-[#2a2a2c] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <n.i className={`w-4 h-4 ${n.active ? 'text-[#F9AE41]' : ''}`} />
          <span className={n.active ? 'font-semibold' : ''}>{n.l}</span>
          {n.active && <div className="absolute right-0 w-1 h-6 bg-[#F9AE41] rounded-l-full" />}
        </div>
      ))}
    </div>
    <div className="p-4 border-t border-[#2d2d30]">
      <div className="flex items-center gap-3 text-red-400 text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors">
        <LogOut className="w-4 h-4" />
        <span>تسجيل الخروج</span>
      </div>
    </div>
  </div>
)

const MockTopbar = ({ title, breadcrumb }: { title: string, breadcrumb: string }) => (
  <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 rounded-tl-xl">
    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
      <span>تنفيذ العمليات</span>
      <span>/</span>
      <span className="text-gray-900">{breadcrumb}</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="بحث..." className="pl-3 pr-9 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-[#F9AE41]" />
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        <span className="text-xs font-bold">أ.م</span>
      </div>
    </div>
  </div>
)

const WindowFrame = ({ children, step }: { children: React.ReactNode, step: number }) => (
  <div className="relative flex flex-col bg-gray-50 rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden h-[600px]">
    {/* Mac-like Window Header (optional, for showcase feel) */}
    <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
      <div className="w-3 h-3 rounded-full bg-red-400"></div>
      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
      <div className="w-3 h-3 rounded-full bg-green-400"></div>
      <div className="mx-auto text-[10px] text-gray-400 font-medium tracking-wider">شاشة {step}</div>
    </div>
    <div className="flex flex-1 overflow-hidden">
      <MockSidebar />
      <div className="flex flex-col flex-1 bg-[#F4F5F7] overflow-hidden">
        {children}
      </div>
    </div>
  </div>
)

// --- Screen 1: Reservation Queue ---
const Screen1Queue = () => (
  <WindowFrame step={1}>
    <MockTopbar title="طابور الحجوزات" breadcrumb="الحجوزات" />
    <div className="p-6 flex-1 overflow-auto">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { l: "تم التنفيذ", v: "32", c: "text-green-600", bg: "bg-green-50", i: CheckCircle },
          { l: "مرفوض", v: "6", c: "text-red-600", bg: "bg-red-50", i: XCircle },
          { l: "مقبول", v: "18", c: "text-blue-600", bg: "bg-blue-50", i: Check },
          { l: "قيد الانتظار", v: "34", c: "text-amber-600", bg: "bg-amber-50", i: Clock }
        ].map((k, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">{k.l}</p>
              <p className="text-2xl font-bold text-gray-800">{k.v}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${k.bg} ${k.c}`}>
              <k.i className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 flex items-end gap-4">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 mb-1 block">التاريخ</label>
          <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#F9AE41]" defaultValue="2024-04-26" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 mb-1 block">الحالة</label>
          <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#F9AE41]">
            <option>الكل</option>
            <option>قيد الانتظار</option>
            <option>مقبول</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 mb-1 block">نوع العملية</label>
          <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#F9AE41]">
            <option>صرف عملة أجنبية</option>
          </select>
        </div>
        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-gray-200">
          <Filter className="w-3 h-3" /> تصفية
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">رقم الحجز</th>
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">تاريخ الموعد</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { id: "FC-2024-000123", name: "هيثم عيسى خليفة", amt: "$ 2,000.00", date: "2024/04/26 11:15 ص", status: "مقبول", badge: "bg-blue-100 text-blue-700" },
              { id: "FC-2024-000122", name: "سالم مصطفى علي", amt: "€ 1,500.00", date: "2024/04/26 10:45 ص", status: "قيد الانتظار", badge: "bg-amber-100 text-amber-700" },
              { id: "FC-2024-000121", name: "محمد التومي", amt: "$ 5,000.00", date: "2024/04/26 10:30 ص", status: "مرفوض", badge: "bg-red-100 text-red-700" },
              { id: "FC-2024-000120", name: "عبد الله البراكه", amt: "$ 1,000.00", date: "2024/04/26 09:15 ص", status: "تم التنفيذ", badge: "bg-green-100 text-green-700" },
            ].map((r, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.id}</td>
                <td className="px-4 py-3 text-gray-600">{r.name}</td>
                <td className="px-4 py-3 text-gray-900 font-semibold" dir="ltr">{r.amt}</td>
                <td className="px-4 py-3 text-gray-500">{r.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${r.badge}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {r.status === 'مقبول' && (
                      <button className="bg-[#F9AE41] text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-[#e09b35]">بدء التنفيذ</button>
                    )}
                    {r.status === 'قيد الانتظار' && (
                      <>
                        <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-[10px] font-bold hover:bg-blue-100">قبول</button>
                        <button className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-[10px] font-bold hover:bg-red-100">رفض</button>
                      </>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 px-2 py-1.5 text-[10px] font-medium border border-gray-200 rounded">التفاصيل</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </WindowFrame>
)

// --- Screen 2: Booking Review ---
const Screen2Review = () => (
  <WindowFrame step={2}>
    <MockTopbar title="مراجعة الحجز" breadcrumb="مراجعة الحجز" />
    <div className="p-6 flex-1 flex flex-col overflow-auto items-center">
      <div className="w-full max-w-md mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-4 text-center">
            <h2 className="text-sm font-bold text-gray-800">تفاصيل الحجز</h2>
            <p className="text-[10px] text-gray-500 mt-1">يرجى مراجعة بيانات العميل قبل المتابعة</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-[11px] text-gray-500">رقم الحجز</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">FC-2024-000123</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-[11px] text-gray-500">اسم العميل</span>
              <span className="text-xs font-bold text-gray-900">هيثم عيسى خليفة</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-[11px] text-gray-500">الرقم الوطني</span>
              <span className="text-xs font-bold text-gray-900">1198404000771</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-[11px] text-gray-500">رقم الجواز</span>
              <span className="text-xs font-bold text-gray-900">A02711359</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-[11px] text-gray-500">رقم الهاتف</span>
              <span className="text-xs font-bold text-gray-900" dir="ltr">091 466 3003</span>
            </div>
            
            <div className="bg-[#fcf8f2] rounded-xl p-4 border border-[#fae2bd] mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-amber-800">المبلغ المطلوب</span>
                <span className="text-lg font-bold text-amber-600" dir="ltr">$ 2,000.00</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-amber-800">سعر الصرف</span>
                <span className="text-xs font-bold text-gray-700" dir="ltr">5.210 د.ل</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-amber-200/50">
                <span className="text-[11px] text-amber-800">المعادل بالدينار</span>
                <span className="text-sm font-bold text-gray-900" dir="ltr">10,420.00 د.ل</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex-1 bg-[#F9AE41] text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:bg-[#e09b35] transition-all">
            متابعة إلى التحقق من الهوية
          </button>
          <button className="bg-white text-gray-600 px-6 py-3 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-all">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </WindowFrame>
)

// --- Screen 3: Identity Verification ---
const Screen3Identity = () => (
  <WindowFrame step={3}>
    <MockTopbar title="التحقق من الهوية" breadcrumb="التحقق من الهوية" />
    <div className="flex-1 flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col overflow-auto">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col items-center justify-center">
           <h3 className="text-sm font-bold text-gray-800 mb-6">رفع أو مسح الوثيقة</h3>
           
           <div className="w-full max-w-lg border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 p-8 flex flex-col items-center justify-center mb-6 relative overflow-hidden group">
              {/* Simulated ID Card preview */}
              <div className="w-64 h-40 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
                 <div className="absolute top-0 w-full h-8 bg-blue-50/50 border-b border-gray-100 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-gray-400">جواز سفر / بطاقة شخصية</span>
                 </div>
                 <div className="p-3 pt-10 flex gap-3">
                    <div className="w-16 h-20 bg-gray-200 rounded object-cover flex items-center justify-center overflow-hidden">
                       <img src="https://i.pravatar.cc/150?img=11" alt="Face" className="w-full h-full object-cover grayscale opacity-80" />
                    </div>
                    <div className="space-y-2 flex-1">
                       <div className="w-full h-2 bg-gray-200 rounded"></div>
                       <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
                       <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                       <div className="w-full h-2 bg-gray-200 rounded mt-4"></div>
                    </div>
                 </div>
                 <div className="absolute bottom-0 w-full h-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between px-2">
                    <span className="text-[6px] text-gray-400 font-mono">1198404000771</span>
                    <span className="text-[6px] text-gray-400 font-mono">A02711359</span>
                 </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-[10px] font-bold">
                <CheckCircle className="w-3 h-3" />
                تم قراءة البيانات بنجاح
              </div>
           </div>

           <div className="flex gap-4 w-full max-w-lg">
              <button className="flex-1 bg-green-600 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                تأكيد ومتابعة
              </button>
              <button className="bg-white text-gray-700 px-6 py-3 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2">
                <Camera className="w-4 h-4" />
                إعادة الالتقاط
              </button>
           </div>
        </div>
      </div>
      
      {/* Side Summary */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 shrink-0 flex flex-col">
        <h4 className="text-xs font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">ملخص العملية</h4>
        <div className="space-y-4 flex-1">
          <div>
            <p className="text-[10px] text-gray-400">العميل</p>
            <p className="text-xs font-bold text-gray-800 mt-1">هيثم عيسى خليفة</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">المبلغ المطلوب</p>
            <p className="text-sm font-bold text-[#F9AE41] mt-1" dir="ltr">$ 2,000.00</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">الحالة</p>
            <span className="inline-block mt-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">التحقق من الهوية</span>
          </div>
        </div>
      </div>
    </div>
  </WindowFrame>
)

// --- Screen 4: Recording & Documentation ---
const Screen4Capture = () => (
  <WindowFrame step={4}>
    <MockTopbar title="التسجيل والتوثيق" breadcrumb="التسجيل والتوثيق" />
    <div className="p-6 flex-1 flex gap-6 overflow-auto">
      {/* Camera Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-black rounded-2xl flex-1 relative overflow-hidden shadow-lg border border-gray-800 flex items-center justify-center">
          {/* Simulated webcam feed */}
          <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=800" alt="Camera Feed" className="w-full h-full object-cover opacity-80" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-white text-[10px] font-bold border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            00:00:15
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
             <button className="w-12 h-12 bg-white/20 backdrop-blur rounded-full border border-white/40 flex items-center justify-center hover:bg-white/30 text-white">
                <Camera className="w-5 h-5" />
             </button>
             <button className="px-6 h-12 bg-red-600 text-white rounded-full font-bold shadow-lg shadow-red-600/30 flex items-center gap-2 hover:bg-red-700 text-xs">
                <CircleDashed className="w-4 h-4 animate-spin" />
                إيقاف التسجيل
             </button>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="h-24 mt-4 bg-white rounded-xl border border-gray-200 p-2 flex gap-2">
           <div className="w-20 h-full rounded-lg overflow-hidden border-2 border-[#F9AE41] relative">
              <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                <Check className="w-2 h-2" />
              </div>
           </div>
           <div className="w-20 h-full bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <ImageIcon className="w-5 h-5 opacity-50" />
           </div>
        </div>
      </div>

      {/* Checklist Area */}
      <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col shrink-0">
        <h4 className="text-sm font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">قائمة المتطلبات</h4>
        
        <div className="space-y-4 flex-1">
          {[
            { l: "صورة العميل (وجه أمامي)", s: true },
            { l: "صورة الجواز / الهوية", s: true },
            { l: "توقيع العميل", s: false },
            { l: "بصمة الإبهام", s: false },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${item.s ? 'bg-green-100 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}>
                <Check className="w-3 h-3" />
              </div>
              <span className={`text-xs ${item.s ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>{item.l}</span>
            </div>
          ))}
        </div>

        <button className="w-full bg-[#F9AE41] text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:bg-[#e09b35] transition-all opacity-50 cursor-not-allowed">
          حفظ التوثيق والمتابعة
        </button>
      </div>
    </div>
  </WindowFrame>
)

// --- Screen 5: Cash Execution ---
const Screen5Execution = () => (
  <WindowFrame step={5}>
    <MockTopbar title="عدّ الأموال وتنفيذ العملية" breadcrumb="تنفيذ العملية" />
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-2 gap-6 h-full">
          
          {/* Left: Machine Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
             <h3 className="text-sm font-bold text-gray-800 mb-6 self-start">آلة عدّ الأموال</h3>
             
             <div className="w-48 h-48 bg-gray-50 rounded-2xl border-2 border-gray-200 flex items-center justify-center mb-8 relative shadow-inner">
                <Banknote className="w-16 h-16 text-gray-300" />
                <div className="absolute top-2 right-2 bg-green-500 w-3 h-3 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
             </div>

             <div className="w-full mb-6">
                <label className="text-[10px] text-gray-500 mb-2 block">الرقم التسلسلي للرزمة (Barcode)</label>
                <div className="flex relative">
                   <input type="text" value="SN-2024-001234" readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 text-center focus:outline-none" />
                   <Scan className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
             </div>

             <div className="w-full mt-auto">
               <label className="text-[10px] text-gray-500 mb-2 block">ملاحظات أمين الصندوق (اختياري)</label>
               <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs h-20 resize-none outline-none focus:border-[#F9AE41]" placeholder="أضف أي ملاحظات حول العملية..."></textarea>
             </div>
          </div>

          {/* Right: Denominations & Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 mb-4">تفاصيل الفئات</h3>
            
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mb-6">
              <table className="w-full text-center text-xs">
                <thead className="bg-gray-100 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2 font-medium">الفئة</th>
                    <th className="py-2 font-medium">العدد</th>
                    <th className="py-2 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2 font-bold text-gray-800">$ 100</td><td className="py-2 text-gray-600">10</td><td className="py-2 font-bold text-gray-800" dir="ltr">$ 1,000.00</td></tr>
                  <tr><td className="py-2 font-bold text-gray-800">$ 50</td><td className="py-2 text-gray-600">10</td><td className="py-2 font-bold text-gray-800" dir="ltr">$ 500.00</td></tr>
                  <tr><td className="py-2 font-bold text-gray-800">$ 20</td><td className="py-2 text-gray-600">20</td><td className="py-2 font-bold text-gray-800" dir="ltr">$ 400.00</td></tr>
                  <tr><td className="py-2 font-bold text-gray-800">$ 10</td><td className="py-2 text-gray-600">10</td><td className="py-2 font-bold text-gray-800" dir="ltr">$ 100.00</td></tr>
                </tbody>
                <tfoot className="bg-gray-100 border-t border-gray-200 font-bold text-gray-900">
                   <tr>
                     <td colSpan={2} className="py-3 text-right pr-4">المبلغ المعدود</td>
                     <td className="py-3 text-green-600 text-sm" dir="ltr">$ 2,000.00</td>
                   </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex-1"></div>

            <div className="bg-[#fcf8f2] rounded-xl p-4 border border-amber-200/50 mb-6 flex justify-between items-center">
               <div>
                  <p className="text-[10px] text-amber-800 mb-1">المبلغ المطلوب في الحجز</p>
                  <p className="text-lg font-bold text-gray-900" dir="ltr">$ 2,000.00</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Check className="w-5 h-5" />
               </div>
            </div>

            <button className="w-full bg-[#F9AE41] text-white py-3.5 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 hover:bg-[#e09b35] transition-all flex justify-center items-center gap-2">
              تأكيد تنفيذ العملية
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>

        </div>
      </div>
    </div>
  </WindowFrame>
)

// --- Screen 6: Final Receipt ---
const Screen6Receipt = () => (
  <WindowFrame step={6}>
    <MockTopbar title="الإيصال والطباعة" breadcrumb="الإيصال" />
    <div className="flex-1 flex overflow-hidden bg-gray-200 p-6 items-center justify-center relative">
      
      {/* Success Overlay / Toast */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-20">
         <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-4 h-4" />
         </div>
         <span className="text-sm font-bold">تم تنفيذ العملية بنجاح</span>
      </div>

      <div className="flex gap-6 w-full max-w-4xl h-full">
         
         {/* Receipt Preview */}
         <div className="bg-white rounded-md shadow-2xl flex-1 flex flex-col overflow-hidden max-h-full">
            <div className="h-4 bg-gray-100 flex items-center justify-center shrink-0 border-b border-gray-200">
               <div className="flex gap-1">
                 <div className="w-1 h-1 rounded-full bg-gray-300"></div><div className="w-1 h-1 rounded-full bg-gray-300"></div><div className="w-1 h-1 rounded-full bg-gray-300"></div>
               </div>
            </div>
            
            <div className="p-8 flex-1 overflow-auto bg-white" style={{ fontFamily: 'monospace, sans-serif' }}>
               <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-6">
                 <h2 className="text-xl font-bold text-gray-900 mb-1">مصرف الواحة</h2>
                 <p className="text-[10px] text-gray-500">إيصال صرف عملة أجنبية واستلام نقدي</p>
                 <p className="text-[10px] text-gray-500 mt-2" dir="ltr">2024/04/26 - 11:28 AM</p>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                  <div>
                    <p className="text-gray-400 text-[9px] mb-1">رقم الحجز</p>
                    <p className="font-bold text-gray-800">FC-2024-000123</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] mb-1">الرقم التسلسلي للعملية</p>
                    <p className="font-bold text-gray-800">SN-2024-001234</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] mb-1">اسم العميل</p>
                    <p className="font-bold text-gray-800">هيثم عيسى خليفة</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] mb-1">الرقم الوطني</p>
                    <p className="font-bold text-gray-800">1198404000771</p>
                  </div>
               </div>

               <div className="border border-gray-200 rounded p-4 mb-6">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-xs text-gray-600">المبلغ المسلّم</span>
                   <span className="font-bold text-lg" dir="ltr">$ 2,000.00</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] text-gray-500">
                   <span>سعر الصرف</span>
                   <span dir="ltr">5.210 د.ل</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                   <span>المعادل بالدينار الليبي</span>
                   <span dir="ltr">10,420.00 د.ل</span>
                 </div>
               </div>

               <table className="w-full text-xs text-center mb-8 border-t border-b border-dashed border-gray-300 py-4">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="pb-2">الفئة</th>
                      <th className="pb-2">العدد</th>
                      <th className="pb-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="py-1">$ 100</td><td className="py-1">10</td><td className="py-1">$ 1,000</td></tr>
                    <tr><td className="py-1">$ 50</td><td className="py-1">10</td><td className="py-1">$ 500</td></tr>
                    <tr><td className="py-1">$ 20</td><td className="py-1">20</td><td className="py-1">$ 400</td></tr>
                    <tr><td className="py-1">$ 10</td><td className="py-1">10</td><td className="py-1">$ 100</td></tr>
                  </tbody>
               </table>

               <div className="grid grid-cols-2 gap-8 mb-8 text-xs text-center border border-gray-200 rounded p-4 bg-gray-50">
                  <div className="border-l border-gray-200">
                     <p className="text-gray-500 text-[9px] mb-4">توقيع العميل</p>
                     <div className="h-10 border-b border-gray-300 mx-4 mb-4 flex items-end justify-center pb-1 text-gray-400">
                       <PenTool className="w-3 h-3" />
                     </div>
                     <p className="text-gray-500 text-[9px] mb-4">بصمة العميل</p>
                     <div className="h-16 w-16 mx-auto border border-gray-300 rounded-lg flex items-center justify-center text-gray-300 bg-white">
                        <Fingerprint className="w-8 h-8" />
                     </div>
                  </div>
                  <div>
                     <p className="text-gray-500 text-[9px] mb-4">توقيع الموظف (أحمد الفرجاني)</p>
                     <div className="h-10 border-b border-gray-300 mx-4 mb-4 flex items-end justify-center pb-1 text-gray-400">
                       <PenTool className="w-3 h-3" />
                     </div>
                     <p className="text-gray-500 text-[9px] mb-4">بصمة الموظف</p>
                     <div className="h-16 w-16 mx-auto border border-gray-300 rounded-lg flex items-center justify-center text-gray-300 bg-white">
                        <Fingerprint className="w-8 h-8" />
                     </div>
                  </div>
               </div>

               <div className="text-center text-[8px] text-gray-400 mt-8">
                  <p>تم تنفيذ العملية بواسطة: خالد علي عربي (أمين الصندوق)</p>
                  <p>الفرع الرئيسي - طرابلس</p>
               </div>
            </div>
         </div>

         {/* Actions */}
         <div className="w-64 flex flex-col gap-4 shrink-0 justify-center">
            <button className="bg-[#F9AE41] text-white py-4 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-[#e09b35] transition-all flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              طباعة نسخة العميل
            </button>
            <button className="bg-white text-gray-700 border border-gray-200 py-4 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              طباعة نسخة الأرشيف
            </button>
            <div className="h-px bg-gray-300 my-4"></div>
            <button className="bg-gray-800 text-white py-3 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
              العودة للرئيسية
            </button>
         </div>

      </div>
    </div>
  </WindowFrame>
)


export default function ConceptPresentationBoard() {
  return (
    <div className="min-h-screen bg-[#111113] p-6 lg:p-12 font-sans overflow-x-hidden" dir="rtl">
      <div className="max-w-[1920px] mx-auto">
        <div className="text-center mb-16">
           <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-[#F9AE41] animate-pulse"></div>
              <span className="text-[#F9AE41] text-xs font-bold tracking-wider">نسخة العرض المرئي (Concept)</span>
           </div>
           <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6">تدفق العمل الجديد: صرف عملة أجنبية واستلام نقدي</h1>
           <p className="text-gray-400 text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
              عرض مفصل للواجهات الست المنفصلة لتسهيل وتنظيم عملية الصرف. تم تصميم هذا النموذج لتحسين تجربة المستخدم وتقليل الأخطاء التشغيلية في مصرف الواحة.
           </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 lg:gap-12">
            <Screen1Queue />
            <Screen2Review />
            <Screen3Identity />
            <Screen4Capture />
            <Screen5Execution />
            <Screen6Receipt />
        </div>
        
        <div className="mt-20 text-center text-gray-600 text-xs pb-10 border-t border-white/10 pt-10">
          تم التصميم والتطوير لصالح مصرف الواحة - نموذج العرض المرئي
        </div>
      </div>
    </div>
  )
}

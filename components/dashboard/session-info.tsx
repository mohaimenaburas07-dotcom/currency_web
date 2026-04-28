import { Card, CardContent } from "@/components/ui/card"
import { Shield, MapPin, Network, Clock, ShieldCheck, UserCircle, Activity } from "lucide-react"

export function SessionInfo() {
  const accountInfo = {
    name: "أحمد محمد",
    role: "موظف صرافة",
    branch: "طرابلس - المركز الرئيسي",
    loginTime: new Date().toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" }),
    ipAddress: "192.168.1.105" // Mock IP for the UI
  }

  return (
    <Card className="w-full flex flex-col border-0 shadow-card bg-white rounded-3xl overflow-hidden col-span-1 h-full relative">
      {/* Background Header Pattern */}
      <div className="h-28 bg-gradient-to-br from-waha-gray-900 via-waha-gray-800 to-black relative shrink-0">
        <div className="absolute inset-0 opacity-20">
           <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
             <path d="M0,100 Q100,50 200,100 T400,100 V100 H0 Z" fill="currentColor" className="text-white" />
           </svg>
        </div>
      </div>

      <CardContent className="p-6 pt-0 flex flex-col items-center flex-1">
        {/* Profile Avatar Overlapping Header */}
        <div className="w-24 h-24 rounded-full bg-white p-2 -mt-12 mb-4 shadow-xl relative z-10 transition-transform hover:scale-105">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-waha-gold/20 to-waha-gold/5 flex items-center justify-center text-waha-gold">
            <UserCircle className="w-12 h-12" />
          </div>
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-waha-gray-900 tracking-tight">{accountInfo.name}</h3>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-waha-gold/10 text-waha-gold-dark rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold">{accountInfo.role}</span>
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col justify-end gap-3">
          {/* Info Rows */}
          <div className="flex items-center justify-between p-3.5 bg-waha-gray-50/80 rounded-2xl border border-waha-gray-100 hover:bg-waha-gray-50 transition-colors">
            <span className="text-xs font-bold text-waha-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-waha-gray-400" /> الفرع
            </span>
            <span className="text-xs font-bold text-waha-gray-900">{accountInfo.branch}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
              <Network className="w-4 h-4 text-slate-400" /> عنوان IP
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-200">
              {accountInfo.ipAddress}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> وقت الدخول
            </span>
            <span className="text-xs font-bold text-slate-700">{accountInfo.loginTime}</span>
          </div>

          {/* System Status Row */}
          <div className="flex items-center justify-center gap-2 mt-2 pt-4 border-t border-waha-gray-100">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-waha-gray-400 uppercase tracking-widest">النظام متصل ويعمل بكفاءة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cpu, Camera, Printer, Calculator, Save, Globe, Loader2, MapPin, ChevronLeft, ShieldCheck, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceManager } from "@/components/admin/hardware/device-manager"

function DeviceCollectionInline({ branchCode, branchName, devices, onRefresh }: any) {
  // We can reuse the logic from DeviceManager but without the Sheet wrapper
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-waha-gray-900 uppercase tracking-widest">قائمة الأجهزة النشطة</h3>
          <p className="text-[10px] font-bold text-waha-gray-400">تحكم في الكاميرات والطابعات المضافة لهذا الفرع</p>
       </div>
       
       <DeviceManager 
         isOpen={true} 
         onClose={() => {}} 
         branchCode={branchCode} 
         branchName={branchName} 
         devices={devices} 
         onRefresh={onRefresh}
         isInline={true}
       />
    </div>
  )
}

export default function HardwareConfigPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  
  // Multi-device state
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null)
  const [isDeviceManagerOpen, setIsDeviceManagerOpen] = useState(false)

  const loadConfigs = async () => {
    try {
      const res = await fetch("/api/admin/branches/hardware")
      const data = await res.json()
      setConfigs(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error("فشل تحميل الإعدادات")
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleUpdate = async (config: any) => {
    setSavingId(config.branchCode)
    try {
      const res = await fetch("/api/admin/branches/hardware", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error()
      toast.success(`تم تحديث إعدادات ${config.branchName}`)
    } catch (err) {
      toast.error("فشل التحديث")
    } finally {
      setSavingId(null)
    }
  }

  const handleTestCamera = async (branchCode: string) => {
    try {
      const res = await fetch(`/api/hardware/camera/status?branchId=${branchCode}`)
      const data = await res.json()
      if (data.available) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error("الكاميرا غير متاحة أو غير مهيأة لهذا الفرع")
    }
  }

  const updateLocalState = (branchCode: string, field: string, value: any) => {
    setConfigs(prev => prev.map(c => c.branchCode === branchCode ? { ...c, [field]: value } : c))
  }

  return (
    <div className="min-h-screen bg-waha-gray-50/50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-waha-gray-900 rounded-xl text-waha-gold">
                <Cpu className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-waha-gray-900 tracking-tight leading-none">إعدادات أجهزة الفروع</h1>
            </div>
            <p className="text-waha-gray-400 font-bold text-sm">ضبط الربط الشبكي لكاميرات المراقبة، آلات العد، والطابعات الحرارية</p>
          </div>
          
          <div className="bg-white px-6 py-4 rounded-[1.25rem] shadow-sm border border-waha-gray-100 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest">System Status</p>
                <p className="text-sm font-black text-emerald-600">بوابة الاتصال المحلية مفعلة</p>
             </div>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
             <div className="col-span-full py-32 text-center">
                <Loader2 className="w-14 h-14 animate-spin text-waha-gold mx-auto mb-4" />
                <p className="text-sm font-black text-waha-gray-300 uppercase tracking-[0.2em] animate-pulse">Scanning Network Nodes...</p>
             </div>
          ) : configs.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-waha-gray-100">
               <MapPin className="w-16 h-16 text-waha-gray-100 mx-auto mb-4" />
               <p className="text-lg font-black text-waha-gray-400">لم يتم العثور على فروع مسجلة في النظام</p>
            </div>
          ) : configs.map((config) => (
            <Card key={config.branchCode} className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden group hover:ring-2 hover:ring-waha-gold/20 transition-all duration-500">
              <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between bg-waha-gray-50/40">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-waha-gray-100 flex items-center justify-center text-waha-gray-900 group-hover:bg-waha-gray-900 group-hover:text-waha-gold transition-all duration-300 shadow-sm">
                       <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                       <CardTitle className="text-xl font-black text-waha-gray-900 leading-none">{config.branchName}</CardTitle>
                       <code className="text-[10px] font-bold text-waha-gray-400 block mt-2 uppercase tracking-[0.15em] opacity-60">UUID: {config.branchCode}</code>
                    </div>
                 </div>
                 <Button 
                   onClick={() => handleUpdate(config)} 
                   disabled={savingId === config.branchCode}
                   className="bg-waha-gray-900 hover:bg-black text-white rounded-[1.15rem] h-14 px-8 font-black text-sm gap-3 shadow-xl shadow-waha-gray-900/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                 >
                    {savingId === config.branchCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} حفظ الإعدادات
                 </Button>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                 <Tabs defaultValue="legacy" className="w-full" dir="rtl">
                    <div className="px-10 pt-6 border-b border-waha-gray-50 bg-waha-gray-50/20">
                       <TabsList className="bg-waha-gray-100/50 p-1 rounded-xl h-12">
                          <TabsTrigger value="legacy" className="rounded-lg font-black text-xs px-8 data-[state=active]:bg-white data-[state=active]:text-waha-gray-900 data-[state=active]:shadow-sm">
                             الإعدادات الأساسية
                          </TabsTrigger>
                          <TabsTrigger value="camera" className="rounded-lg font-black text-xs px-8 data-[state=active]:bg-white data-[state=active]:text-waha-gray-900 data-[state=active]:shadow-sm">
                             إعدادات الكاميرا
                          </TabsTrigger>
                          <TabsTrigger value="collection" className="rounded-lg font-black text-xs px-8 data-[state=active]:bg-white data-[state=active]:text-waha-gray-900 data-[state=active]:shadow-sm flex items-center gap-2">
                             مجموعة الأجهزة 
                             <Badge className="bg-waha-gold/20 text-waha-gray-900 border-0 h-5 px-1.5 font-black text-[9px]">{config.devices?.length || 0}</Badge>
                          </TabsTrigger>
                       </TabsList>
                    </div>

                    <TabsContent value="legacy" className="p-10 mt-0 space-y-8 animate-in fade-in duration-500">
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-4 h-4 text-waha-gold" /> عنوان الكاميرا (NVR)
                             </label>
                             <Input 
                                value={config.cameraIp || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraIp", e.target.value)}
                                placeholder="e.g. 10.10.25.10" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-waha-gold" /> عنوان آلة العد
                             </label>
                             <Input 
                                value={config.counterIp || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "counterIp", e.target.value)}
                                placeholder="e.g. 10.10.25.15" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold"
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Printer className="w-4 h-4 text-waha-gold" /> عنوان الطابعة الحرارية
                             </label>
                             <Input 
                                value={config.printerIp || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "printerIp", e.target.value)}
                                placeholder="e.g. 10.10.25.20" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-4 h-4 text-waha-gold" /> بوابة الربط (Local Gateway)
                             </label>
                             <Input 
                                value={config.gatewayUrl || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "gatewayUrl", e.target.value)}
                                placeholder="http://localhost:8080" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold font-sans"
                             />
                          </div>
                       </div>
                    </TabsContent>

                    <TabsContent value="camera" className="p-10 mt-0 space-y-8 animate-in fade-in duration-500">
                       <div className="flex items-center justify-between mb-2">
                          <div>
                             <h3 className="text-lg font-black text-waha-gray-900 leading-none">إعدادات الكاميرا المتقدمة</h3>
                             <p className="text-xs font-bold text-waha-gray-400 mt-2 uppercase tracking-widest">تحكم في بروتوكولات RTSP واللقطات الحية</p>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="flex items-center gap-3 bg-waha-gray-50 px-4 py-2 rounded-xl border border-waha-gray-100">
                                <span className="text-[10px] font-black text-waha-gray-400 uppercase tracking-wider">تفعيل الكاميرا</span>
                                <input 
                                   type="checkbox" 
                                   checked={config.cameraEnabled} 
                                   onChange={(e) => updateLocalState(config.branchCode, "cameraEnabled", e.target.checked)}
                                   className="w-5 h-5 rounded border-waha-gray-300 text-waha-gold focus:ring-waha-gold"
                                />
                             </div>
                             <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTestCamera(config.branchCode)}
                                className="rounded-xl border-waha-gray-200 font-black text-[11px] h-11 px-6 uppercase tracking-wider hover:bg-waha-gray-900 hover:text-white transition-all shadow-sm"
                             >
                                <Globe className="w-4 h-4 ml-2" /> اختبار الاتصال
                             </Button>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">اسم الكاميرا</label>
                             <Input 
                                value={config.cameraName || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraName", e.target.value)}
                                placeholder="Main Entrance Camera" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">نوع البث</label>
                             <select 
                                value={config.cameraStreamType || "snapshot"}
                                onChange={(e) => updateLocalState(config.branchCode, "cameraStreamType", e.target.value)}
                                className="w-full h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold px-4 text-sm focus:ring-2 focus:ring-waha-gold outline-none"
                             >
                                <option value="snapshot">Snapshot (Proxy)</option>
                                <option value="rtsp">RTSP (Experimental)</option>
                                <option value="browser">Web Browser API</option>
                             </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">اسم المستخدم</label>
                             <Input 
                                value={config.cameraUsername || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraUsername", e.target.value)}
                                placeholder="admin" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">كلمة المرور</label>
                             <Input 
                                type="password"
                                value={config.cameraPassword || ""} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraPassword", e.target.value)}
                                placeholder="••••••••" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">منفذ HTTP</label>
                             <Input 
                                type="number"
                                value={config.cameraHttpPort || 80} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraHttpPort", e.target.value)}
                                placeholder="80" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">منفذ RTSP</label>
                             <Input 
                                type="number"
                                value={config.cameraRtspPort || 554} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraRtspPort", e.target.value)}
                                placeholder="554" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">مسار اللقطة (Snapshot Path)</label>
                          <Input 
                             value={config.cameraSnapshotPath || "/snap.jpg"} 
                             onChange={(e) => updateLocalState(config.branchCode, "cameraSnapshotPath", e.target.value)}
                             placeholder="/snap.jpg" 
                             className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">مسار RTSP الرئيسي</label>
                             <Input 
                                value={config.cameraRtspMainPath || "/unicast/c1/s0/live"} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraRtspMainPath", e.target.value)}
                                placeholder="/unicast/c1/s0/live" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest">مسار RTSP الفرعي</label>
                             <Input 
                                value={config.cameraRtspSubPath || "/unicast/c1/s1/live"} 
                                onChange={(e) => updateLocalState(config.branchCode, "cameraRtspSubPath", e.target.value)}
                                placeholder="/unicast/c1/s1/live" 
                                className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                             />
                          </div>
                       </div>
                       
                       <div className="p-5 bg-amber-50/50 rounded-[1.5rem] border border-amber-100/50 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                             <Settings2 className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-amber-900 mb-1">ملاحظة تقنية</p>
                             <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                                المتصفحات لا تدعم تشغيل بروتوكول RTSP مباشرة. يتم تخزين هذه الإعدادات للاستخدام في الترقيات القادمة عبر وسيط بث (Stream Gateway). حالياً يتم استخدام Snapshot كخيار افتراضي.
                             </p>
                          </div>
                       </div>
                    </TabsContent>

                    <TabsContent value="collection" className="p-10 mt-0 animate-in fade-in slide-in-from-left-4 duration-500">
                       <DeviceCollectionInline 
                          branchCode={config.branchCode}
                          branchName={config.branchName}
                          devices={config.devices || []}
                          onRefresh={loadConfigs}
                       />
                    </TabsContent>
                 </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <DeviceManager 
        isOpen={isDeviceManagerOpen}
        onClose={() => {
          setIsDeviceManagerOpen(false)
          setSelectedBranch(null)
        }}
        branchCode={selectedBranch?.branchCode || ""}
        branchName={selectedBranch?.branchName || ""}
        devices={selectedBranch?.devices || []}
        onRefresh={loadConfigs}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Camera, Printer, Calculator, Scan, Plus, Trash2, Settings2, Globe, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Device {
  id: string
  name: string
  type: "CAMERA" | "SCANNER" | "PRINTER" | "COUNTER"
  role?: string
  connectionInfo: any
  isDefault: boolean
  status: string
}

interface DeviceManagerProps {
  isOpen: boolean
  onClose: () => void
  branchCode: string
  branchName: string
  devices: Device[]
  onRefresh: () => void
  isInline?: boolean
}

export function DeviceManager({ isOpen, onClose, branchCode, branchName, devices, onRefresh, isInline }: DeviceManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: "",
    type: "CAMERA" as const,
    role: "",
    ip: "",
    port: "",
    isDefault: false
  })

  const handleAdd = async () => {
    if (!newDevice.name || !newDevice.ip) {
      toast.error("يرجى إكمال البيانات الأساسية")
      return
    }

    try {
      const res = await fetch("/api/admin/branches/hardware/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode,
          name: newDevice.name,
          type: newDevice.type,
          role: newDevice.role,
          connectionInfo: { ip: newDevice.ip, port: newDevice.port },
          isDefault: newDevice.isDefault
        })
      })

      if (!res.ok) throw new Error()
      
      toast.success("تم إضافة الجهاز بنجاح")
      setIsAdding(false)
      setNewDevice({ name: "", type: "CAMERA", role: "", ip: "", port: "", isDefault: false })
      onRefresh()
    } catch (err) {
      toast.error("فشل إضافة الجهاز")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/branches/hardware/devices?id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error()
      toast.success("تم حذف الجهاز")
      onRefresh()
    } catch (err) {
      toast.error("فشل حذف الجهاز")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CAMERA": return <Camera className="w-4 h-4" />
      case "SCANNER": return <Scan className="w-4 h-4" />
      case "PRINTER": return <Printer className="w-4 h-4" />
      case "COUNTER": return <Calculator className="w-4 h-4" />
      default: return <Settings2 className="w-4 h-4" />
    }
  }

  const content = (
    <div className={cn("space-y-8", isInline ? "" : "p-8")}>
      {/* Add Device Section */}
      {!isAdding ? (
        <Button 
          onClick={() => setIsAdding(true)}
          className="w-full h-16 bg-white hover:bg-waha-gray-50 border-2 border-dashed border-waha-gray-200 text-waha-gray-900 rounded-2xl font-black gap-3 shadow-none transition-all hover:border-waha-gold hover:text-waha-gold group"
        >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          إضافة جهاز جديد للفرع
        </Button>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-waha-gray-100 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest">نوع الجهاز</label>
                <Select value={newDevice.type} onValueChange={(v: any) => setNewDevice({...newDevice, type: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAMERA">كاميرا (NVR)</SelectItem>
                    <SelectItem value="SCANNER">ماسح ضوئي</SelectItem>
                    <SelectItem value="PRINTER">طابعة حرارية</SelectItem>
                    <SelectItem value="COUNTER">آلة عد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest">اسم الجهاز</label>
                <Input 
                  value={newDevice.name} 
                  onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="مثلاً: الكاميرا الرئيسية"
                  className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest">عنوان IP / المنفذ</label>
                <Input 
                  value={newDevice.ip} 
                  onChange={e => setNewDevice({...newDevice, ip: e.target.value})}
                  placeholder="10.10.x.x"
                  className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest">الدور / الموقع</label>
                <Input 
                  value={newDevice.role} 
                  onChange={e => setNewDevice({...newDevice, role: e.target.value})}
                  placeholder="مثلاً: مكتب الصراف 1"
                  className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold"
                />
              </div>
           </div>

           <div className="flex items-center gap-4 pt-2">
              <Button onClick={handleAdd} className="flex-1 h-12 bg-waha-gold text-waha-gray-900 hover:bg-waha-gold/90 font-black rounded-xl shadow-lg shadow-waha-gold/20">حفظ الجهاز</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-12 px-6 font-bold text-waha-gray-400">إلغاء</Button>
           </div>
        </div>
      )}

      {/* Device List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
           أجهزة الفرع المسجلة ({devices.length})
        </h3>
        
        {devices.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-waha-gray-200">
             <Globe className="w-10 h-10 text-waha-gray-100 mx-auto mb-2" />
             <p className="text-xs font-bold text-waha-gray-400 italic">لا توجد أجهزة مسجلة في مجموعة هذا الفرع</p>
             <p className="text-[10px] font-bold text-waha-gold mt-1 uppercase">Using Legacy Single-Device Config</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map(device => (
              <div key={device.id} className="bg-white p-5 rounded-2xl border border-waha-gray-100 shadow-sm flex items-center justify-between group transition-all hover:ring-2 hover:ring-waha-gold/10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-waha-gray-50 flex items-center justify-center text-waha-gray-400 group-hover:bg-waha-gray-900 group-hover:text-waha-gold transition-colors">
                      {getTypeIcon(device.type)}
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-waha-gray-900">{device.name}</h4>
                        {device.isDefault && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black h-5 uppercase">Default</Badge>}
                      </div>
                      <p className="text-[10px] font-bold text-waha-gray-400 mt-0.5 flex items-center gap-1.5 uppercase tracking-wider">
                         <Globe className="w-3 h-3" /> {device.connectionInfo?.ip || "Local"} {device.role && `\u2022 ${device.role}`}
                      </p>
                   </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(device.id)}
                  className="text-waha-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (isInline) return content

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-xl border-r-0 bg-waha-gray-50/50 p-0 overflow-y-auto" dir="rtl">
        <SheetHeader className="p-8 bg-white border-b border-waha-gray-100">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-waha-gray-900 flex items-center justify-center text-waha-gold shadow-lg">
                <Settings2 className="w-6 h-6" />
             </div>
             <div>
                <SheetTitle className="text-2xl font-black text-waha-gray-900 leading-none">إدارة أجهزة الفرع</SheetTitle>
                <SheetDescription className="text-waha-gray-400 font-bold mt-2">
                   {branchName} - {branchCode}
                </SheetDescription>
             </div>
          </div>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}

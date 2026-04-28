"use client"

import { useState } from "react"
import { Plus, X, Upload, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaCapture } from "./media-capture"

interface AddReservationDialogProps {
  customer: { id: string, name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddReservationDialog({ customer, open, onOpenChange, onSuccess }: AddReservationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    amountRequested: "4000",
    currencyCode: "USD",
    notes: ""
  })

  const resetForm = () => {
    setFiles([])
    setFormData({ amountRequested: "4000", currencyCode: "USD", notes: "" })
  }

  const handleCapture = (capturedFiles: File[]) => {
    setFiles(prev => [...prev, ...capturedFiles])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return
    
    setIsLoading(true)
    try {
      const fd = new FormData()
      fd.append("customerId", customer.id)
      fd.append("amountRequested", formData.amountRequested)
      fd.append("currencyCode", formData.currencyCode)
      fd.append("notes", formData.notes)
      
      files.forEach(file => {
        fd.append("files", file)
      })

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "خطأ في حفظ الحجز")

      toast.success("تم تسجيل الحجز والمرفقات بنجاح")
      onOpenChange(false)
      resetForm()
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) resetForm(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-none shadow-2xl bg-background p-0" dir="rtl">
        <DialogHeader className="bg-waha-gray-900 text-white p-8">
          <DialogTitle className="text-right text-2xl font-bold font-sans flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-waha-gold flex items-center justify-center text-waha-gray-900">
               <Plus className="w-6 h-6" />
             </div>
             <div>
               <span>تسجيل حجز جديد لـ</span>
               <span className="text-waha-gold mr-2">{customer?.name}</span>
             </div>
          </DialogTitle>
          <DialogDescription className="text-right text-waha-gray-400 mt-2">
            قم بإرفاق الصور والفيديوهات اللازمة وتحديد المبلغ لإكمال عملية الحجز بنجاح.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 p-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-right">
              <Label htmlFor="amount" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">المبلغ المطلوب</Label>
              <Input 
                id="amount" 
                type="number" 
                className="h-12 bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold text-lg font-bold"
                value={formData.amountRequested} 
                onChange={(e) => setFormData({...formData, amountRequested: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="currency" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">العملة</Label>
              <Input 
                id="currency" 
                className="h-12 bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold text-lg font-bold"
                value={formData.currencyCode} 
                onChange={(e) => setFormData({...formData, currencyCode: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <Label htmlFor="notes" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">ملاحظات إضافية</Label>
            <Textarea 
              id="notes" 
              className="bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold resize-none h-24"
              value={formData.notes} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="أدخل أي ملاحظات إضافية هنا..."
            />
          </div>

          {/* Media Capture Section */}
          <div className="space-y-4 pt-2">
             <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-waha-gold" />
                <Label className="text-sm font-bold text-waha-gray-900">المرفقات (صور وفيديو)</Label>
             </div>
             <MediaCapture onCapture={handleCapture} />
          </div>

          <div className="flex items-center justify-between border-t border-waha-gray-100 pt-8 mt-4">
             <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${files.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-waha-gray-300"}`} />
               <span className="text-xs font-bold text-waha-gray-500">{files.length} ملفات جاهزة للرفع</span>
             </div>
             <Button type="submit" disabled={isLoading || !customer} className="bg-waha-gray-900 hover:bg-black text-white px-10 h-12 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إكمال عملية الحجز"}
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

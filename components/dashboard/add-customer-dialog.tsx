"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, User, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const customerSchema = z.object({
  name: z.string().min(3, "لا يقل الاسم عن 3 أحرف"),
  nationalId: z.string().min(10, "الرقم الوطني غير صحيح"),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface AddCustomerDialogProps {
  onSuccess: () => void
}

export function AddCustomerDialog({ onSuccess }: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  })

  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.message || "خطأ في إضافة العميل")

      toast.success("تم إضافة العميل بنجاح")
      setOpen(false)
      reset()
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-waha-gold hover:bg-waha-gold-dark text-waha-gray-900">
          <Plus className="w-4 h-4" />
          إضافة عميل جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] border-none shadow-2xl bg-background" dir="rtl">
        <DialogHeader className="bg-waha-gray-900 text-white p-6 rounded-t-lg">
          <DialogTitle className="text-right text-2xl font-bold font-sans">إضافة عميل جديد</DialogTitle>
          <DialogDescription className="text-right text-waha-gold font-medium">
            قم بإدخال بيانات العميل الأساسية لتسجيله في النظام.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="gap-6 py-6 px-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">اسم العميل بالكامل</Label>
              <Input 
                id="name" 
                className="bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold" 
                {...register("name")} 
                placeholder="أدخل الاسم الرباعي" 
                disabled={isLoading} 
              />
              {errors.name && <p className="text-[10px] text-destructive font-bold">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">الرقم الوطني</Label>
              <Input 
                id="nationalId" 
                className="bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold font-mono" 
                {...register("nationalId")} 
                placeholder="1xxxxxxxxxxx" 
                disabled={isLoading} 
              />
              {errors.nationalId && <p className="text-[10px] text-destructive font-bold">{errors.nationalId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">رقم الهاتف</Label>
                <Input 
                  id="phone" 
                  className="bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold" 
                  {...register("phone")} 
                  placeholder="091xxxxxxx" 
                  disabled={isLoading} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-waha-gray-500 uppercase tracking-wider">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  className="bg-waha-gray-100 border-waha-gray-200 focus-visible:ring-waha-gold" 
                  {...register("email")} 
                  placeholder="name@example.com" 
                  disabled={isLoading} 
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-8 w-full">
            <Button type="submit" disabled={isLoading} className="w-full bg-waha-gray-900 hover:bg-black text-white h-12 text-lg font-bold shadow-lg">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ بيانات العميل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

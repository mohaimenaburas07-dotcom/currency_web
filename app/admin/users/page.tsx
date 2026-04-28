"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Shield, MapPin, Search, Loader2, Mail, Lock, User as UserIcon, Settings, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    role: "OPERATOR",
    branchCode: ""
  })

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(data.users || [])
      setBranches(data.branches || [])
    } catch (err) {
      toast.error("فشل تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "فشل إنشاء المستخدم")
      
      toast.success("تم إنشاء المستخدم بنجاح")
      setIsCreateOpen(false)
      setFormData({ username: "", password: "", email: "", name: "", role: "OPERATOR", branchCode: "" })
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-waha-gray-50/50 p-8" dir="rtl">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-waha-gray-900 rounded-xl text-waha-gold">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-waha-gray-900 tracking-tight">إدارة مستخدمي النظام</h1>
            </div>
            <p className="text-waha-gray-400 font-bold text-sm">إدارة صلاحيات الموظفين والربط مع فروع المصرف</p>
          </div>

          <div className="flex items-center gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-waha-gold hover:bg-waha-gold/90 text-waha-gray-900 font-black rounded-2xl h-14 px-8 gap-2 shadow-xl shadow-waha-gold/20 border-0 transition-all hover:scale-105 active:scale-95">
                  <Plus className="w-5 h-5" /> إضافة موظف جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300" dir="rtl">
                <DialogHeader className="p-10 bg-waha-gray-900 text-white relative">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Users className="w-32 h-32" />
                  </div>
                  <DialogTitle className="text-3xl font-black relative z-10">إنشاء حساب جديد</DialogTitle>
                  <p className="text-waha-gold text-xs font-black mt-2 opacity-80 uppercase tracking-widest relative z-10">New Banking Operator Access</p>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="p-10 space-y-6 bg-white">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-waha-gold" /> اسم المستخدم
                      </label>
                      <Input 
                        required
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        placeholder="e.g. ahmed_ops" 
                        className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-4 h-4 text-waha-gold" /> كلمة المرور
                      </label>
                      <Input 
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••" 
                        className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-4 h-4 text-waha-gold" /> البريد الإلكتروني الرسمي
                    </label>
                    <Input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="employee@alwahabank.ly" 
                      className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-bold focus:ring-waha-gold focus:border-waha-gold text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4 text-waha-gold" /> الصلاحيات
                      </label>
                      <Select 
                        value={formData.role} 
                        onValueChange={val => setFormData({...formData, role: val})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-black text-sm">
                          <SelectValue placeholder="اختر الدور..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-waha-gray-100 p-2">
                          <SelectItem value="OPERATOR" className="font-bold py-3 rounded-xl">مشغل نظام (Operator)</SelectItem>
                          <SelectItem value="ADMIN" className="font-bold py-3 rounded-xl text-purple-600">مدير نظام (Admin)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-waha-gold" /> الفرع التابع له
                      </label>
                      <Select 
                        value={formData.branchCode} 
                        onValueChange={val => setFormData({...formData, branchCode: val})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-waha-gray-50 border-waha-gray-100 font-black text-sm text-right">
                          <SelectValue placeholder="اختر الفرع..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-waha-gray-100 p-2 max-h-[300px]">
                          {branches.map(b => (
                            <SelectItem key={b.code} value={b.code} className="font-bold py-3 rounded-xl">{b.name_ar}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      disabled={isCreating}
                      className="w-full bg-waha-gray-900 hover:bg-black text-white font-black h-16 rounded-[1.25rem] shadow-2xl shadow-waha-gray-900/30 gap-3 transition-all hover:-translate-y-1"
                    >
                      {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : "إكمال عملية الإنشاء وتفعيل الحساب"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table Section */}
        <Card className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3 bg-waha-gray-50 px-5 py-3 rounded-2xl border border-waha-gray-100 w-96 transition-all focus-within:ring-2 focus-within:ring-waha-gold/20">
              <Search className="w-5 h-5 text-waha-gray-400" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو اسم المستخدم..." 
                className="bg-transparent border-0 focus:ring-0 text-sm font-bold w-full placeholder:text-waha-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <Badge className="bg-waha-gray-100 text-waha-gray-400 border-none font-black text-[10px] py-1 px-3">
                 إجمالي المستخدمين: {users.length}
               </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-waha-gray-50/50 border-b border-waha-gray-100">
                    <th className="px-10 py-6 text-[10px] font-black text-waha-gray-400 uppercase tracking-[0.2em]">بيانات الموظف</th>
                    <th className="px-10 py-6 text-[10px] font-black text-waha-gray-400 uppercase tracking-[0.2em]">الصلاحيات</th>
                    <th className="px-10 py-6 text-[10px] font-black text-waha-gray-400 uppercase tracking-[0.2em]">الفرع الحالي</th>
                    <th className="px-10 py-6 text-[10px] font-black text-waha-gray-400 uppercase tracking-[0.2em]">حالة الدخول</th>
                    <th className="px-10 py-6 text-[10px] font-black text-waha-gray-400 uppercase tracking-[0.2em]">تاريخ الإضافة</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-32 text-center">
                         <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-waha-gold" />
                            <p className="text-xs font-black text-waha-gray-300 uppercase tracking-widest animate-pulse">Syncing Directory...</p>
                         </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                           <Users className="w-16 h-16" />
                           <p className="text-lg font-black">لا يوجد مستخدمين مطابقين</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.map((user) => {
                    const branch = branches.find(b => b.code === user.branch_code)
                    return (
                      <tr key={user.id} className="border-b border-waha-gray-50 hover:bg-waha-gray-50/30 transition-all group cursor-pointer">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-waha-gray-100 flex items-center justify-center text-waha-gray-400 font-black text-2xl group-hover:bg-waha-gray-900 group-hover:text-waha-gold transition-all duration-300 shadow-sm">
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-base font-black text-waha-gray-900 group-hover:text-black">{user.name || user.username}</p>
                              <p className="text-xs font-bold text-waha-gray-400">@{user.username} • {user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <Badge className={user.role === 'ADMIN' 
                            ? "bg-purple-50 text-purple-600 border-purple-100 px-3 py-1.5 rounded-xl font-black text-[10px]" 
                            : "bg-blue-50 text-blue-600 border-blue-100 px-3 py-1.5 rounded-xl font-black text-[10px]"}>
                            <Shield className="w-3.5 h-3.5 ml-1.5" /> {user.role === 'ADMIN' ? 'مدير نظام' : 'مشغل نظام'}
                          </Badge>
                        </td>
                        <td className="px-10 py-8">
                          {branch ? (
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-waha-gold/10 rounded-lg text-waha-gold-dark">
                                  <MapPin className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-waha-gray-700">{branch.name_ar}</p>
                                  <p className="text-[10px] font-bold text-waha-gray-300 uppercase">{branch.code.split('-')[0]}</p>
                               </div>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-waha-gray-300 italic">بانتظار الربط بفرع...</span>
                          )}
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse" />
                              <p className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Active Online</p>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-xs font-black text-waha-gray-400 font-sans tabular-nums">
                          {new Date(user.created_at).toLocaleDateString('ar-LY', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

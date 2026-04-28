"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  MoreHorizontal,
  Clock,
  ArrowLeft,
  Gift,
} from "lucide-react"
import Link from "next/link"

// Action buttons similar to the reference Buy/Sell/Add Cash/More
const actionButtons = [
  {
    icon: ArrowUpRight,
    label: "قبول",
    color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
  },
  {
    icon: ArrowDownLeft,
    label: "رفض",
    color: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
  },
  {
    icon: Wallet,
    label: "تنفيذ",
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
    href: "/execute",
  },
  {
    icon: MoreHorizontal,
    label: "المزيد",
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
]

// Transactions similar to reference
const transactions = [
  {
    type: "عملية صرف",
    customer: "أحمد الفيتوري",
    time: "اليوم، 8:50 ص",
    amount: "-5,000",
    currency: "دولار",
    positive: false,
  },
  {
    type: "إيداع نقدي",
    customer: "فاطمة السنوسي",
    time: "اليوم، 8:49 ص",
    amount: "+3,500",
    currency: "يورو",
    positive: true,
  },
  {
    type: "عملية صرف",
    customer: "محمد الشريف",
    time: "اليوم، 8:50 ص",
    amount: "-10,000",
    currency: "دولار",
    positive: false,
  },
]

// Recent currencies similar to wishlist
const recentCurrencies = [
  {
    name: "دولار أمريكي",
    code: "USD",
    icon: "$",
    amount: "43,862.25",
    change: "+2.44%",
    positive: true,
  },
  {
    name: "يورو",
    code: "EUR",
    icon: "€",
    amount: "35,124.80",
    change: "-0.85%",
    positive: false,
  },
]

export function QuickActions() {
  return (
    <div className="space-y-4">
      {/* Actions Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">الإجراءات</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {actionButtons.map((action, index) => {
              const Wrapper = action.href ? Link : "button"
              return (
                <Wrapper
                  key={index}
                  href={action.href || "#"}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${action.color} transition-colors`}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </Wrapper>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Promo Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-l from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 overflow-hidden relative">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">عرض خاص!</p>
              <p className="text-xs text-muted-foreground mb-2">سعر صرف مميز للمبالغ الكبيرة</p>
              <Button variant="link" className="h-auto p-0 text-xs text-waha-gold hover:text-waha-gold-dark">
                عرض التفاصيل
              </Button>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-waha-gold to-amber-500 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">المعاملات</CardTitle>
          <Button variant="link" className="h-auto p-0 text-xs text-waha-gold">
            عرض الكل
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {transactions.map((tx, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.positive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {tx.positive ? (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{tx.type}</p>
                <p className="text-[10px] text-muted-foreground">{tx.time}</p>
              </div>
              <div className="text-left">
                <p className={`text-xs font-semibold ${tx.positive ? "text-emerald-500" : "text-red-500"}`}>
                  {tx.amount}
                </p>
                <p className="text-[10px] text-muted-foreground">{tx.currency}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Currencies (like wishlist) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">العملات المفضلة</CardTitle>
          <Button variant="link" className="h-auto p-0 text-xs text-waha-gold">
            عرض الكل
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {recentCurrencies.map((currency, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-waha-gold/20 to-waha-gold/10 flex items-center justify-center">
                <span className="text-waha-gold font-bold text-sm">{currency.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{currency.name}</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{currency.amount}</p>
                <p className={`text-[10px] ${currency.positive ? "text-emerald-500" : "text-red-500"}`}>
                  {currency.change}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

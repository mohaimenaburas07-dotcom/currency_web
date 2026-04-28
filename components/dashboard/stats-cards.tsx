"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Wallet,
  CreditCard,
  MapPin,
} from "lucide-react"

// Currency portfolio cards similar to crypto investment portfolios
const portfolioCards = [
  {
    currency: "دولار أمريكي",
    code: "USD",
    icon: "$",
    color: "from-emerald-500 to-emerald-600",
    totalShares: "125,000",
    totalReturn: "+2.44%",
    positive: true,
  },
  {
    currency: "يورو",
    code: "EUR",
    icon: "€",
    color: "from-blue-500 to-blue-600",
    totalShares: "85,000",
    totalReturn: "-0.10%",
    positive: false,
  },
  {
    currency: "جنيه إسترليني",
    code: "GBP",
    icon: "£",
    color: "from-amber-500 to-amber-600",
    totalShares: "42,500",
    totalReturn: "+1.85%",
    positive: true,
  },
]

export function PortfolioCards() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">محفظة العملات</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {portfolioCards.map((card, index) => (
          <Card
            key={index}
            className={`p-5 border-0 bg-gradient-to-br ${card.color} text-white relative overflow-hidden`}
          >
            <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl font-bold">{card.icon}</span>
            </div>
            <div className="mt-8">
              <p className="text-white/80 text-xs mb-1">{card.currency}</p>
              <p className="text-2xl font-bold">{card.totalShares}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-[10px]">إجمالي المعاملات</p>
                <p className="text-sm font-semibold">{card.totalShares}</p>
              </div>
              <div className="text-left">
                <p className="text-white/60 text-[10px]">نسبة التغير</p>
                <p className={`text-sm font-semibold ${card.positive ? "text-white" : "text-red-200"}`}>
                  {card.totalReturn}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function MainStatCard() {
  return (
    <Card className="p-6 bg-gradient-to-l from-indigo-600 via-violet-600 to-violet-700 border-0 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path
            d="M0,100 Q100,50 200,100 T400,100 V200 H0 Z"
            fill="currentColor"
            className="text-white/20"
          />
        </svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">القيمة الحالية</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">1,250,000</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">د.ل</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-emerald-300 text-sm font-medium">+125,000</span>
              <span className="text-white/60 text-sm">هذا الأسبوع</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        {/* Mini chart visualization */}
        <div className="mt-6 h-16">
          <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 Q30,45 60,40 T120,35 T180,25 T240,30 T300,15"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M0,50 Q30,45 60,40 T120,35 T180,25 T240,30 T300,15 V60 H0 Z"
              fill="url(#chartGradient)"
            />
          </svg>
        </div>
      </div>
    </Card>
  )
}

export function StatsCards() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequestedUsd: 0,
    totalEquivalentLyd: 0,
    totalExecutedLyd: 0,
    totalBranches: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("alwaha_auth_token") : ""
        const headers: any = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        // Fetch a large number of requests to calculate totals (mocking an aggregation endpoint)
        const res = await fetch(`/api/v1/fx-houses/purchase-requests?limit=1000&page=1`, { headers })
        
        if (!res.ok) {
          setLoading(false)
          return
        }

        const json = await res.json()
        if (json && json.data && Array.isArray(json.data)) {
          let reqUsd = 0
          let reqLyd = 0
          let execLyd = 0

          json.data.forEach((req: any) => {
            const amountUsd = parseFloat(req.amount_requested || "0")
            const price = parseFloat(req.contract?.bank_transfer_price || "4.85")
            const amountLyd = amountUsd * price
            
            const stateStr = typeof req.state === "object" ? (req.state?.code || "pending") : (req.state || "pending")
            const isExecuted = stateStr.toLowerCase() === "processed" || stateStr.toLowerCase() === "completed"

            reqUsd += amountUsd
            reqLyd += amountLyd
            if (isExecuted) {
              execLyd += amountLyd
            }
          })

          setStats({
            totalRequestedUsd: reqUsd,
            totalEquivalentLyd: reqLyd,
            totalExecutedLyd: execLyd,
            totalBranches: json.totalBranches || 0,
          })
        }
        
        // Also fetch branches count directly if not in stats
        const branchRes = await fetch("/api/admin/branches/hardware", { headers })
        if (branchRes.ok) {
          const branches = await branchRes.json()
          setStats(prev => ({ ...prev, totalBranches: branches.length }))
        }
      } catch (err) {
        console.error("Error fetching stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const kpis = [
    {
      label: "إجمالي المبلغ المطلوب (دولار)",
      value: loading ? "..." : `$${stats.totalRequestedUsd.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
      color: "emerald-500",
    },
    {
      label: "إجمالي المعادل (دينار)",
      value: loading ? "..." : `${stats.totalEquivalentLyd.toLocaleString()} د.ل`,
      icon: <Wallet className="w-5 h-5 text-blue-500" />,
      color: "blue-500",
    },
    {
      label: "إجمالي المبلغ المنفذ (دينار)",
      value: loading ? "..." : `${stats.totalExecutedLyd.toLocaleString()} د.ل`,
      icon: <CreditCard className="w-5 h-5 text-waha-gold" />,
      color: "waha-gold",
    },
    {
      label: "إجمالي الفروع النشطة",
      value: loading ? "..." : stats.totalBranches.toString(),
      icon: <MapPin className="w-5 h-5 text-indigo-500" />,
      color: "indigo-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="p-6 border-0 shadow-sm bg-white rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div className={`absolute right-0 top-0 w-1.5 h-full bg-${kpi.color}`} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-waha-gray-400 mb-2 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-black text-waha-gray-900">{kpi.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-${kpi.color}/10 flex items-center justify-center shrink-0`}>
              {kpi.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

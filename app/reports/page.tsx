"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileBarChart,
  Printer,
} from "lucide-react"

const reports = [
  {
    id: 1,
    title: "تقرير المعاملات اليومية",
    description: "ملخص جميع المعاملات المنفذة خلال اليوم",
    type: "daily",
    lastGenerated: "اليوم 10:30 ص",
    icon: FileText,
  },
  {
    id: 2,
    title: "تقرير الحجوزات الأسبوعي",
    description: "إحصائيات الحجوزات خلال الأسبوع الماضي",
    type: "weekly",
    lastGenerated: "15 يناير 2024",
    icon: Calendar,
  },
  {
    id: 3,
    title: "تقرير العملاء الشهري",
    description: "تحليل نشاط العملاء والعملاء الجدد",
    type: "monthly",
    lastGenerated: "1 يناير 2024",
    icon: Users,
  },
  {
    id: 4,
    title: "تقرير الأداء المالي",
    description: "تحليل مفصل للتدفقات المالية",
    type: "financial",
    lastGenerated: "1 يناير 2024",
    icon: DollarSign,
  },
]

export default function ReportsPage() {
  return (
    <DashboardLayout title="التقارير" breadcrumb="تحليلات وتقارير">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">مركز التقارير</h2>
            <p className="text-sm text-muted-foreground">عرض وتحميل التقارير والإحصائيات</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="month">
              <SelectTrigger className="w-40 bg-card border-0 shadow-sm">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="year">هذه السنة</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2 bg-waha-gold hover:bg-waha-gold-dark text-waha-gray-900">
              <FileBarChart className="w-4 h-4" />
              إنشاء تقرير مخصص
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">إجمالي المصروفات</p>
                <p className="text-2xl font-bold mt-1">1,250,000 د.ل</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">عدد المعاملات</p>
                <p className="text-2xl font-bold mt-1">156</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+8.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">العملاء النشطون</p>
                <p className="text-2xl font-bold mt-1">89</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">-2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">متوسط المعاملة</p>
                <p className="text-2xl font-bold mt-1">8,012 د.ل</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+5.7%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <FileBarChart className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Available Reports */}
        <div>
          <h3 className="text-lg font-semibold mb-4">التقارير المتاحة</h3>
          <div className="grid grid-cols-2 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-waha-gold/10 flex items-center justify-center shrink-0">
                    <report.icon className="w-6 h-6 text-waha-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{report.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      آخر إنشاء: {report.lastGenerated}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

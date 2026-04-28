import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentReservations } from "@/components/dashboard/recent-reservations"
import { SessionInfo } from "@/components/dashboard/session-info"

export default function DashboardPage() {
  return (
    <DashboardLayout title="الرئيسية" breadcrumb="نظرة عامة">
      <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Top KPIs Row */}
        <StatsCards />

        {/* Content Row: Recent Reservations + Session/Account Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 flex">
            <RecentReservations />
          </div>
          <div className="lg:col-span-1 flex">
            <SessionInfo />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

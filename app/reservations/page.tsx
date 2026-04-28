import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ReservationsTable } from "@/components/dashboard/reservations-table"

export default function ReservationsPage() {
  return (
    <DashboardLayout title="الحجوزات" breadcrumb="إدارة الحجوزات">
      <ReservationsTable />
    </DashboardLayout>
  )
}

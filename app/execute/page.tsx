import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ExecuteOperation } from "@/components/execute/execute-operation"

export default function ExecutePage() {
  return (
    <DashboardLayout title="تنفيذ العملية" breadcrumb="العمليات">
      <ExecuteOperation />
    </DashboardLayout>
  )
}

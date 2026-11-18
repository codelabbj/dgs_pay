import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CardOperations } from "@/components/partner/card-operations"

export default function Page() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CardOperations />
      </Suspense>
    </DashboardLayout>
  )
}

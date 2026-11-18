import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CardsList } from "@/components/partner/cards-list"

export default function Page() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CardsList />
      </Suspense>
    </DashboardLayout>
  )
}

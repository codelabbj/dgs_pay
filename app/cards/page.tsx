import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CardsOverview } from "@/components/partner/cards-overview"

export default function Page() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CardsOverview />
      </Suspense>
    </DashboardLayout>
  )
}

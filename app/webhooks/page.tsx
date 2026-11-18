import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WebhooksContent } from "@/components/partner/webhooks-content"

export default function Page() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <WebhooksContent />
      </Suspense>
    </DashboardLayout>
  )
}

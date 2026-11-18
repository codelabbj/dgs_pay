import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CryptoContent } from "@/components/partner/crypto-content"

export default function Page() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CryptoContent />
      </Suspense>
    </DashboardLayout>
  )
}

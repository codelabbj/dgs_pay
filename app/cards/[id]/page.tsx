import { DashboardLayout } from "@/components/dashboard-layout"
import { CardDetail } from "@/components/partner/card-detail"

export default function Page({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <CardDetail id={decodeURIComponent(params.id)} />
    </DashboardLayout>
  )
}

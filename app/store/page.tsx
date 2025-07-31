import { DashboardLayout } from "@/components/dashboard-layout"

export default function Store() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Store</h1>
        <div className="bg-card rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Store management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

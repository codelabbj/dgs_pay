import { DashboardLayout } from "@/components/dashboard-layout"

export default function Customers() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Customers</h1>
        <div className="bg-card rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Customer management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

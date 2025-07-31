import { DashboardLayout } from "@/components/dashboard-layout"

export default function Developers() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Developers</h1>
        <div className="bg-card rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Developer tools coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

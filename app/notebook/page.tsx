import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { NotebookView } from "@/components/notebook/notebook-view"

export default async function NotebookPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  const { data: salons } = await supabase.from("salons").select("*").order("order_index", { ascending: true })

  // Fetch scheduled surgeries with related doctors and salons
  const { data: surgeries } = await supabase
    .from("surgeries")
    .select(`
      *,
      salon:salons(id, name),
      responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(id, name),
      senior_resident:doctors!surgeries_senior_resident_id_fkey(id, name),
      junior_resident:doctors!surgeries_junior_resident_id_fkey(id, name)
    `)
    .eq("is_waiting_list", false)
    .not("surgery_date", "is", null)
    .order("surgery_date", { ascending: true })

  const scheduledSurgeries = surgeries || []
  const allSalons = salons || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Defter Görünümü</h2>
          <p className="text-gray-600 mt-2">Ameliyat defteri - 2026 yılı ajanda formatında</p>
        </div>

        <NotebookView surgeries={scheduledSurgeries} salons={allSalons} year={2026} />
      </main>
    </div>
  )
}

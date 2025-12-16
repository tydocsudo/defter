import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"
import { FlipbookView } from "@/components/flipbook/flipbook-view"

export default async function FliphtmlPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerClient()

  const { data: salons } = await supabase.from("salons").select("*").order("order_index", { ascending: true })

  const { data: doctors } = await supabase.from("doctors").select("*").order("name", { ascending: true })

  const { data: surgeries } = await supabase
    .from("surgeries")
    .select(`
      *,
      salon:salons(id, name),
      responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(id, name),
      senior_resident:doctors!surgeries_senior_resident_id_fkey(id, name),
      junior_resident:doctors!surgeries_junior_resident_id_fkey(id, name),
      surgery_notes(id, note, created_at, created_by)
    `)
    .eq("is_waiting_list", false)
    .not("surgery_date", "is", null)
    .order("surgery_date", { ascending: true })

  const { data: dayNotes } = await supabase.from("day_notes").select("*").order("note_date", { ascending: true })

  return (
    <main className="min-h-screen">
      <FlipbookView
        salons={salons || []}
        surgeries={surgeries || []}
        dayNotes={dayNotes || []}
        doctors={doctors || []}
      />
    </main>
  )
}

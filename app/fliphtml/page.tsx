import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { FlipbookView } from "@/components/flipbook/flipbook-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FliphtmlPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = createAdminClient()

  console.log("[v0] Fliphtml - fetching ALL surgeries (no salon filter)")

  const { data: salons } = await supabase.from("salons").select("*").order("order_index", { ascending: true })

  const { data: doctors } = await supabase.from("doctors").select("*").order("name", { ascending: true })

  const { data: surgeries } = await supabase
    .from("surgeries")
    .select(`
      *,
      salon:salons(id, name),
      responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(id, name),
      creator:profiles!surgeries_created_by_fkey(id, username, first_name, last_name),
      approver:profiles!surgeries_approved_by_fkey(id, username, first_name, last_name),
      surgery_notes(id, note, created_at, created_by)
    `)
    .eq("is_waiting_list", false)
    .not("surgery_date", "is", null)
    .order("surgery_date", { ascending: true })

  const { data: dayNotes } = await supabase.from("day_notes").select("*").order("note_date", { ascending: true })

  console.log("[v0] Fliphtml - fetched surgeries:", {
    count: surgeries?.length || 0,
    dates: surgeries?.map((s) => s.surgery_date) || [],
    salons: surgeries?.map((s) => s.salon?.name) || [],
    sample: surgeries?.[0]
      ? {
          patient_name: surgeries[0].patient_name,
          surgery_date: surgeries[0].surgery_date,
          salon_id: surgeries[0].salon_id,
          is_waiting_list: surgeries[0].is_waiting_list,
        }
      : null,
  })

  return (
    <main className="min-h-screen">
      <FlipbookView
        salons={salons || []}
        surgeries={surgeries || []}
        dayNotes={dayNotes || []}
        doctors={doctors || []}
        initialDate={searchParams.date}
      />
    </main>
  )
}

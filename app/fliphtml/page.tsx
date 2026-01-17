import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { FlipbookView } from "@/components/flipbook/flipbook-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FliphtmlPage({
  searchParams,
}: {
  searchParams: { date?: string; salon?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = createAdminClient()

  const { data: salons } = await supabase.from("salons").select("*").order("order_index", { ascending: true })

  const { data: doctors } = await supabase.from("doctors").select("*").order("name", { ascending: true })

  const { data: surgeries } = await supabase
    .from("surgeries")
    .select(`
      *,
      salon:salons(id, name),
      responsible_doctor:doctors!responsible_doctor_id(id, name),
      creator:profiles!created_by(id, username, first_name, last_name),
      approver:profiles!approved_by(id, username, first_name, last_name),
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
        initialDate={searchParams.date}
        initialSalonId={searchParams.salon}
      />
    </main>
  )
}

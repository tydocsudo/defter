import { getCurrentUser } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { MonthlyView } from "@/components/calendar/monthly-view"
import { AddSurgeryButton } from "@/components/add-surgery-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  const salonsRes = await supabase.from("salons").select("*").order("order_index")
  const salons = salonsRes.data || []
  const defaultSalonId = salons[0]?.id

  const [doctorsRes, surgeriesRes, dayNotesRes] = await Promise.all([
    supabase.from("doctors").select("*").order("name"),
    supabase
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
      .eq("salon_id", defaultSalonId)
      .not("surgery_date", "is", null)
      .order("surgery_date", { ascending: true }),
    supabase.from("day_notes").select("*").eq("salon_id", defaultSalonId).order("note_date", { ascending: true }),
  ])

  const doctors = doctorsRes.data || []
  const surgeries = surgeriesRes.data || []
  const dayNotes = dayNotesRes.data || []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-4 md:py-6">
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Ameliyat Takvimi</h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
              Aylık ameliyat planlarını görüntüleyin
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="w-full">
              <AddSurgeryButton salons={salons} doctors={doctors} />
            </div>
            <Link href="/fliphtml" className="w-full">
              <Button className="w-full h-full flex items-center justify-center gap-2 bg-transparent" variant="outline">
                <BookOpen className="h-4 w-4" />
                Defter Görünümü
              </Button>
            </Link>
          </div>
        </div>

        <MonthlyView
          salons={salons}
          doctors={doctors}
          isAdmin={user.is_admin}
          initialSurgeries={surgeries}
          initialDayNotes={dayNotes}
        />
      </main>
    </div>
  )
}

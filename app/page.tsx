import { getCurrentUser } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { MonthlyView } from "@/components/calendar/monthly-view"
import { AddSurgeryButton } from "@/components/add-surgery-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, FileDown, FileSpreadsheet } from "lucide-react"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch salons and doctors from Supabase
  const [salonsRes, doctorsRes] = await Promise.all([
    supabase.from("salons").select("*").order("order_index"),
    supabase.from("doctors").select("*").order("name"),
  ])

  const salons = salonsRes.data || []
  const doctors = doctorsRes.data || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-4 md:py-6">
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Ameliyat Takvimi</h2>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">Aylık ameliyat planlarını görüntüleyin</p>
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
            <div className="flex gap-2 w-full">
              <Button
                id="export-pdf-button"
                className="flex-1 flex items-center justify-center gap-2 bg-transparent"
                variant="outline"
                disabled
              >
                <FileDown className="h-4 w-4" />
                PDF İndir
              </Button>
              <Button
                id="export-excel-button"
                className="flex-1 flex items-center justify-center gap-2 bg-transparent"
                variant="outline"
                disabled
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel İndir
              </Button>
            </div>
          </div>
        </div>

        <MonthlyView salons={salons} doctors={doctors} isAdmin={user.is_admin} />
      </main>
    </div>
  )
}

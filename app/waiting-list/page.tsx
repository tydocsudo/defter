import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { WaitingListTable } from "@/components/waiting-list/waiting-list-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function WaitingListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  const [surgeriesRes, doctorsRes, salonsRes] = await Promise.all([
    supabase
      .from("surgeries")
      .select(`
        *,
        responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(id, name)
      `)
      .eq("is_waiting_list", true)
      .is("salon_id", null)
      .is("surgery_date", null)
      .order("patient_name"),
    supabase.from("doctors").select("*").order("name"),
    supabase.from("salons").select("*").order("order_index"),
  ])

  const waitingSurgeries = surgeriesRes.data || []
  const doctors = doctorsRes.data || []
  const salons = salonsRes.data || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-4 dark:text-slate-100">
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Bekleme Listesi</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Ameliyat bekleyen hastaları görüntüleyin ve takvime atama yapın
          </p>
        </div>

        <Card className="dark:bg-slate-800 dark:border-slate-600">
          <CardHeader>
            <CardTitle className="dark:text-slate-100">Bekleyen Hastalar</CardTitle>
            <CardDescription className="dark:text-slate-400">
              Toplam {waitingSurgeries.length} hasta bekleme listesinde
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WaitingListTable surgeries={waitingSurgeries} doctors={doctors} salons={salons} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

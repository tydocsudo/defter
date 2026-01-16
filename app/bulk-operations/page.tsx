import { getCurrentUser } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { BulkOperations } from "@/components/admin/bulk-operations"

export default async function BulkOperationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  const [salonsRes, doctorsRes] = await Promise.all([
    supabase.from("salons").select("*").order("order_index"),
    supabase.from("doctors").select("*").order("name"),
  ])

  const salons = salonsRes.data || []
  const doctors = doctorsRes.data || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Toplu İşlemler</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Hastaları toplu olarak taşıyın, ekleyin veya güncelleyin
          </p>
        </div>

        <BulkOperations salons={salons} doctors={doctors} />
      </main>
    </div>
  )
}

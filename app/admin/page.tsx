import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/admin/user-management"
import { SalonManagement } from "@/components/admin/salon-management"
import { DoctorManagement } from "@/components/admin/doctor-management"
import { ActivityLogs } from "@/components/admin/activity-logs"
import { DoctorAssignmentsManagement } from "@/components/admin/doctor-assignments-management"
import { BackupManagement } from "@/components/admin/backup-management"
import { BulkOperations } from "@/components/admin/bulk-operations"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user?.is_admin) {
    redirect("/")
  }

  const supabase = await createClient()

  // Fetch all data from Supabase
  const [usersRes, salonsRes, doctorsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("salons").select("*").order("order_index"),
    supabase.from("doctors").select("*").order("name"),
  ])

  console.log("[v0] Admin page - users fetch result:", {
    data: usersRes.data,
    error: usersRes.error,
    count: usersRes.data?.length,
  })

  console.log("[v0] Admin page - salons fetch result:", {
    data: salonsRes.data,
    error: salonsRes.error,
    count: salonsRes.data?.length,
  })

  console.log("[v0] Admin page - doctors fetch result:", {
    data: doctorsRes.data,
    error: doctorsRes.error,
    count: doctorsRes.data?.length,
  })

  const users = usersRes.data || []
  const salons = salonsRes.data || []
  const doctors = doctorsRes.data || []

  console.log("[v0] Admin page - passing users to component:", users.length)
  console.log("[v0] Admin page - passing salons to component:", salons.length)
  console.log("[v0] Admin page - passing doctors to component:", doctors.length)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Yönetim Paneli</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Kullanıcıları, salonları ve hocaları yönetin</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full lg:w-auto dark:bg-slate-800 overflow-x-auto">
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="salons">Salonlar</TabsTrigger>
            <TabsTrigger value="doctors">Hocalar</TabsTrigger>
            <TabsTrigger value="assignments" className="hidden md:flex">
              Hoca Atamaları
            </TabsTrigger>
            <TabsTrigger value="bulk" className="hidden md:flex">
              Toplu İşlemler
            </TabsTrigger>
            <TabsTrigger value="logs" className="hidden md:flex">
              İşlem Geçmişi
            </TabsTrigger>
            <TabsTrigger value="backup" className="hidden md:flex">
              Yedekleme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement users={users} />
          </TabsContent>

          <TabsContent value="salons">
            <SalonManagement salons={salons} />
          </TabsContent>

          <TabsContent value="doctors">
            <DoctorManagement doctors={doctors} />
          </TabsContent>

          <TabsContent value="assignments">
            <DoctorAssignmentsManagement salons={salons} doctors={doctors} />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkOperations salons={salons} doctors={doctors} />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="backup">
            <BackupManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

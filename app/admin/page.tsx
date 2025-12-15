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

  const users = usersRes.data || []
  const salons = salonsRes.data || []
  const doctors = doctorsRes.data || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Yönetim Paneli</h2>
          <p className="text-gray-600 mt-2">Kullanıcıları, salonları ve hocaları yönetin</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="salons">Salonlar</TabsTrigger>
            <TabsTrigger value="doctors">Hocalar</TabsTrigger>
            <TabsTrigger value="assignments">Hoca Atamaları</TabsTrigger>
            <TabsTrigger value="logs">İşlem Geçmişi</TabsTrigger>
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

          <TabsContent value="logs">
            <ActivityLogs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { WaitingListPageClient } from "@/components/waiting-list/waiting-list-page-client"

export default async function WaitingListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header user={user} />
      <main className="container mx-auto px-4 py-6">
        <WaitingListPageClient />
      </main>
    </div>
  )
}

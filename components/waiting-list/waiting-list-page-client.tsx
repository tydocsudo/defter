"use client"

import { useState, useEffect } from "react"
import type { SurgeryWithDetails, Doctor, Salon } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WaitingListTable } from "@/components/waiting-list/waiting-list-table"

interface WaitingListPageClientProps {
  initialSurgeries: SurgeryWithDetails[]
  doctors: Doctor[]
  salons: Salon[]
}

export function WaitingListPageClient({ initialSurgeries, doctors, salons }: WaitingListPageClientProps) {
  const [surgeries, setSurgeries] = useState<SurgeryWithDetails[]>(initialSurgeries)

  const fetchWaitingList = async () => {
    try {
      const res = await fetch("/api/surgeries?is_waiting_list=true")

      if (!res.ok) {
        console.error("Waiting list fetch failed with status:", res.status)
        return
      }

      const text = await res.text()
      if (!text) {
        console.error("Waiting list response is empty")
        return
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("Waiting list response is not valid JSON:", text.substring(0, 100))
        return
      }

      if (!Array.isArray(data)) {
        console.error("Waiting list response is not an array:", data)
        return
      }

      // Filter and sort the same way as waiting-list-sidebar
      const actualWaiting = data.filter((s: any) => !s.salon_id && !s.surgery_date)
      actualWaiting.sort((a: any, b: any) => a.patient_name.localeCompare(b.patient_name, "tr"))
      setSurgeries(actualWaiting)
    } catch (error) {
      console.error("Error fetching waiting list:", error)
    }
  }

  // Listen for waiting list changes
  useEffect(() => {
    const handleRefresh = () => {
      fetchWaitingList()
    }

    window.addEventListener("waitingListChanged", handleRefresh)

    return () => {
      window.removeEventListener("waitingListChanged", handleRefresh)
    }
  }, [])

  return (
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
            Toplam {surgeries.length} hasta bekleme listesinde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WaitingListTable surgeries={surgeries} doctors={doctors} salons={salons} />
        </CardContent>
      </Card>
    </main>
  )
}

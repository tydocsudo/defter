"use client"

import { useState, useEffect } from "react"
import { WaitingListTable } from "@/components/waiting-list/waiting-list-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { SurgeryWithDetails, Doctor, Salon } from "@/lib/types"

export function WaitingListPageClient() {
  const [waitingSurgeries, setWaitingSurgeries] = useState<SurgeryWithDetails[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [salons, setSalons] = useState<Salon[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const [surgeriesRes, doctorsRes, salonsRes] = await Promise.all([
        fetch("/api/surgeries?is_waiting_list=true"),
        fetch("/api/doctors"),
        fetch("/api/salons"),
      ])

      // Check if response is JSON
      if (surgeriesRes.ok) {
        const contentType = surgeriesRes.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const surgeriesData = await surgeriesRes.json()
          setWaitingSurgeries(surgeriesData || [])
        } else {
          console.error("Error: Surgeries API did not return JSON")
        }
      }

      if (doctorsRes.ok) {
        const contentType = doctorsRes.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const doctorsData = await doctorsRes.json()
          setDoctors(doctorsData || [])
        }
      }

      if (salonsRes.ok) {
        const contentType = salonsRes.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const salonsData = await salonsRes.json()
          setSalons(salonsData || [])
        }
      }
    } catch (error) {
      console.error("Error fetching waiting list data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
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
            {isLoading ? "Yükleniyor..." : `Toplam ${waitingSurgeries.length} hasta bekleme listesinde`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : (
            <WaitingListTable surgeries={waitingSurgeries} doctors={doctors} salons={salons} />
          )}
        </CardContent>
      </Card>
    </>
  )
}

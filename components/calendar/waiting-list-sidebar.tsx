"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { SurgeryWithDetails, Salon, Doctor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, GripVertical } from "lucide-react"
import Link from "next/link"

interface WaitingListSidebarProps {
  salons: Salon[]
  doctors: Doctor[]
  onDataChange: () => void
}

export function WaitingListSidebar({ salons, doctors, onDataChange }: WaitingListSidebarProps) {
  const [waitingSurgeries, setWaitingSurgeries] = useState<SurgeryWithDetails[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    fetchWaitingList()
  }, [])

  const fetchWaitingList = async () => {
    try {
      const res = await fetch("/api/surgeries?is_waiting_list=true")
      const data = await res.json()
      console.log("[v0] Fetched waiting list data:", data)
      const actualWaiting = data.filter((s: any) => !s.salon_id && !s.surgery_date)
      setWaitingSurgeries(actualWaiting)
    } catch (error) {
      console.error("Error fetching waiting list:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent, surgeryId: string) => {
    setDraggedId(surgeryId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("surgeryId", surgeryId)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  useEffect(() => {
    const handleRefresh = () => {
      console.log("[v0] Refreshing waiting list")
      fetchWaitingList()
    }

    // Listen for data changes
    window.addEventListener("waitingListChanged", handleRefresh)

    return () => {
      window.removeEventListener("waitingListChanged", handleRefresh)
    }
  }, [])

  useEffect(() => {
    fetchWaitingList()
  }, [onDataChange])

  return (
    <Card className="w-full lg:w-64 flex-shrink-0 h-fit lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Bekleme Listesi
          </CardTitle>
          <Badge variant="secondary">{waitingSurgeries.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {waitingSurgeries.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">Liste boş</p>
        ) : (
          waitingSurgeries.map((surgery) => (
            <div
              key={surgery.id}
              draggable
              onDragStart={(e) => handleDragStart(e, surgery.id)}
              onDragEnd={handleDragEnd}
              className={`bg-white border rounded-lg p-2 cursor-move hover:shadow-md transition-shadow ${
                draggedId === surgery.id ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{surgery.patient_name}</p>
                  <p className="text-xs text-gray-600 truncate" title={surgery.procedure_name}>
                    {surgery.procedure_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{surgery.protocol_number}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <Link href="/waiting-list">
          <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
            Detaylı Görünüm
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

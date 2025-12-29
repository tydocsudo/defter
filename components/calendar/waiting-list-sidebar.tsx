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
  layout?: "vertical" | "horizontal" // New prop to control layout
}

export function WaitingListSidebar({ salons, doctors, onDataChange, layout = "vertical" }: WaitingListSidebarProps) {
  const [waitingSurgeries, setWaitingSurgeries] = useState<SurgeryWithDetails[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    fetchWaitingList()
  }, [])

  const fetchWaitingList = async () => {
    try {
      const res = await fetch("/api/surgeries?is_waiting_list=true")
      const data = await res.json()
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
      fetchWaitingList()
    }

    window.addEventListener("waitingListChanged", handleRefresh)

    return () => {
      window.removeEventListener("waitingListChanged", handleRefresh)
    }
  }, [])

  useEffect(() => {
    fetchWaitingList()
  }, [onDataChange])

  const patientsPerColumn = 3
  const columnCount = Math.ceil(waitingSurgeries.length / patientsPerColumn)

  const columns: SurgeryWithDetails[][] = []
  for (let i = 0; i < columnCount; i++) {
    columns.push(waitingSurgeries.slice(i * patientsPerColumn, (i + 1) * patientsPerColumn))
  }

  return (
    <Card className="w-full flex-shrink-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Bekleme Listesi
          </CardTitle>
          <Badge variant="secondary">{waitingSurgeries.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {waitingSurgeries.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">Liste boş</p>
        ) : layout === "horizontal" ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col gap-2 min-w-[200px]">
                {column.map((surgery) => (
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
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {waitingSurgeries.map((surgery) => (
              <div
                key={surgery.id}
                draggable
                onDragStart={(e) => handleDragStart(e, surgery.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow ${
                  draggedId === surgery.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{surgery.patient_name}</p>
                    <p className="text-xs text-gray-600 mt-1">{surgery.procedure_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{surgery.protocol_number}</p>
                    {surgery.phone_number_1 && (
                      <p className="text-xs text-gray-500 mt-1">Tel: {surgery.phone_number_1}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/waiting-list">
          <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
            Detaylı Görünüm
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

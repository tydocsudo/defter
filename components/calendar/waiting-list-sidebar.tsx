"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { SurgeryWithDetails, Salon, Doctor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, GripVertical, Wand2 } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AvailableSlotsDialog } from "@/components/waiting-list/available-slots-dialog"
import { findAvailableDates } from "@/lib/actions/auto-scheduler"
import { assignFromWaitingList } from "@/lib/actions/surgeries"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface WaitingListSidebarProps {
  salons: Salon[]
  doctors: Doctor[]
  onDataChange: () => void
  layout?: "vertical" | "horizontal"
}

export function WaitingListSidebar({ salons, doctors, onDataChange, layout = "vertical" }: WaitingListSidebarProps) {
  const [waitingSurgeries, setWaitingSurgeries] = useState<SurgeryWithDetails[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [autoFindOpen, setAutoFindOpen] = useState(false)
  const [selectedSurgery, setSelectedSurgery] = useState<SurgeryWithDetails | null>(null)
  const [autoFindSalonId, setAutoFindSalonId] = useState<string>("")
  const [autoFindDoctorId, setAutoFindDoctorId] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [showSlots, setShowSlots] = useState(false)

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

  const handleAutoFindClick = (e: React.MouseEvent, surgery: SurgeryWithDetails) => {
    e.stopPropagation()
    setSelectedSurgery(surgery)
    // Pre-fill with surgery's doctor if available
    if (surgery.responsible_doctor_id) {
      setAutoFindDoctorId(surgery.responsible_doctor_id)
    }
    setAutoFindSalonId("")
    setAvailableSlots([])
    setShowSlots(false)
    setAutoFindOpen(true)
  }

  const handleSearchSlots = async () => {
    if (!autoFindSalonId || !autoFindDoctorId || !selectedSurgery) return

    setIsSearching(true)
    try {
      const result = await findAvailableDates(autoFindSalonId, autoFindDoctorId, selectedSurgery.id)
      if (result.success && result.slots) {
        setAvailableSlots(result.slots)
        setShowSlots(true)
      } else {
        alert(result.error || "Uygun tarih bulunamadı")
      }
    } catch (error: any) {
      alert(error.message || "Arama sırasında hata oluştu")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSlot = async (date: string) => {
    if (!selectedSurgery || !autoFindSalonId) return

    setIsAssigning(true)
    try {
      await assignFromWaitingList(selectedSurgery.id, autoFindSalonId, date, autoFindDoctorId)

      sessionStorage.setItem(
        "flipbook_scroll_target",
        JSON.stringify({
          date: date,
          salonId: autoFindSalonId,
        }),
      )

      // Close dialog first
      setAutoFindOpen(false)

      // Trigger data refresh events
      window.dispatchEvent(new Event("waitingListChanged"))
      onDataChange()

      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        window.location.href = "/fliphtml"
      }, 100)
    } catch (error: any) {
      alert(error.message || "Atama sırasında hata oluştu")
    } finally {
      setIsAssigning(false)
    }
  }

  const patientsPerColumn = 3
  const columnCount = Math.ceil(waitingSurgeries.length / patientsPerColumn)

  const columns: SurgeryWithDetails[][] = []
  for (let i = 0; i < columnCount; i++) {
    columns.push(waitingSurgeries.slice(i * patientsPerColumn, (i + 1) * patientsPerColumn))
  }

  const renderPatientCard = (surgery: SurgeryWithDetails, isHorizontal: boolean) => (
    <div
      key={surgery.id}
      draggable
      onDragStart={(e) => handleDragStart(e, surgery.id)}
      onDragEnd={handleDragEnd}
      className={`bg-white border rounded-lg ${isHorizontal ? "p-2" : "p-3"} cursor-move hover:shadow-md transition-shadow ${
        draggedId === surgery.id ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`${isHorizontal ? "text-xs" : "text-sm"} font-semibold text-gray-900 truncate`}>
            {surgery.patient_name}
          </p>
          <p
            className={`${isHorizontal ? "text-xs" : "text-xs"} text-gray-600 ${isHorizontal ? "truncate" : "mt-1"}`}
            title={surgery.procedure_name}
          >
            {surgery.procedure_name}
          </p>
          <p className={`text-xs text-gray-500 ${isHorizontal ? "" : "mt-1"}`}>{surgery.protocol_number}</p>
          {!isHorizontal && surgery.phone_number_1 && (
            <p className="text-xs text-gray-500 mt-1">Tel: {surgery.phone_number_1}</p>
          )}
        </div>
        <Button
          size="icon"
          variant="destructive"
          className="h-6 w-6 flex-shrink-0"
          onClick={(e) => handleAutoFindClick(e, surgery)}
          title="Otomatik Yer Bul"
        >
          <Wand2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
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
                  {column.map((surgery) => renderPatientCard(surgery, true))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {waitingSurgeries.map((surgery) => renderPatientCard(surgery, false))}
            </div>
          )}
          <Link href="/waiting-list">
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Detaylı Görünüm
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Dialog open={autoFindOpen} onOpenChange={setAutoFindOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Otomatik Yer Bul - {selectedSurgery?.patient_name}</DialogTitle>
          </DialogHeader>

          {!showSlots ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salon Seçin</Label>
                  <Select value={autoFindSalonId} onValueChange={setAutoFindSalonId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Salon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {salons.map((salon) => (
                        <SelectItem key={salon.id} value={salon.id}>
                          {salon.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Doktor Seçin</Label>
                  <Select value={autoFindDoctorId} onValueChange={setAutoFindDoctorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Doktor seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSearchSlots}
                disabled={!autoFindSalonId || !autoFindDoctorId || isSearching}
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isSearching ? "Aranıyor..." : "Uygun Tarihleri Bul"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" onClick={() => setShowSlots(false)} className="mb-2">
                Geri Dön
              </Button>
              <AvailableSlotsDialog slots={availableSlots} onSelectSlot={handleSelectSlot} isLoading={isAssigning} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

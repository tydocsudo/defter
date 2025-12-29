"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { Doctor, SurgeryWithDetails, DayNote, DailyAssignedDoctor } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignDoctorToDay } from "@/lib/actions/notes"
import { assignFromWaitingList } from "@/lib/actions/surgeries"
import { useState } from "react"
import { Maximize2 } from "lucide-react"

interface MonthlyCalendarProps {
  currentDate: Date
  surgeries: SurgeryWithDetails[]
  dayNotes: DayNote[]
  assignedDoctors: DailyAssignedDoctor[]
  selectedDate: string | null
  onDateSelect: (date: string) => void
  doctors: Doctor[]
  isAdmin: boolean
  salonId: string
  onDataChange: () => void
}

export function MonthlyCalendar({
  currentDate,
  surgeries,
  dayNotes,
  assignedDoctors,
  selectedDate,
  onDateSelect,
  doctors,
  isAdmin,
  salonId,
  onDataChange,
}: MonthlyCalendarProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []

  // JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  // We show: Monday-Friday (skip weekends)
  // If month starts on Monday (1), offset = 0
  // If month starts on Tuesday (2), offset = 1
  // If month starts on Wednesday (3), offset = 2, etc.
  // If month starts on Saturday (6) or Sunday (0), offset = 0 (starts on next Monday)
  let offset = 0
  if (firstDay === 0) {
    // Sunday - skip to Monday
    offset = 0
  } else if (firstDay === 6) {
    // Saturday - skip to Monday
    offset = 0
  } else {
    // Monday=1 -> offset=0, Tuesday=2 -> offset=1, Wednesday=3 -> offset=2, etc.
    offset = firstDay - 1
  }

  // Add empty cells for days before the first weekday of month
  for (let i = 0; i < offset; i++) {
    days.push(null)
  }

  // Add actual days, skipping weekends
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const dayOfWeek = date.getDay()
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(i)
    }
  }

  const getSurgeriesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return surgeries.filter((s) => s.surgery_date === dateStr)
  }

  const hasNotesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const hasDayNotes = dayNotes.some((n) => n.note_date === dateStr)
    const daySurgeries = surgeries.filter((s) => s.surgery_date === dateStr)
    const hasSurgeryNotes = daySurgeries.some((s) => s.surgery_notes && s.surgery_notes.length > 0)
    return hasDayNotes || hasSurgeryNotes
  }

  const getAssignedDoctorForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return assignedDoctors.find((ad) => ad.assigned_date === dateStr)
  }

  const handleDoctorAssign = async (day: number, doctorId: string) => {
    setIsAssigning(true)
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      await assignDoctorToDay(salonId, doctorId, dateStr)
      onDataChange()
    } catch (error: any) {
      console.error("[v0] Error assigning doctor:", error)
      alert(error.message || "Hoca ataması yapılırken bir hata oluştu")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault()
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setDragOver(dateStr)
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault()
    setDragOver(null)

    const surgeryId = e.dataTransfer.getData("surgeryId")
    if (!surgeryId) {
      console.log("[v0] No surgery ID in drop event")
      return
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    console.log("[v0] Dropping surgery onto calendar:", { surgeryId, salonId, dateStr })

    try {
      const result = await assignFromWaitingList(surgeryId, salonId, dateStr)
      console.log("[v0] Drop result:", result)

      window.dispatchEvent(new Event("waitingListChanged"))
      window.dispatchEvent(new Event("calendarDataChanged"))

      onDataChange()
      alert("Hasta başarıyla takvime eklendi!")
    } catch (error: any) {
      console.error("[v0] Error assigning from waiting list:", error)
      alert(error.message || "Hasta ataması yapılırken bir hata oluştu")
    }
  }

  const toggleCellExpansion = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedDate(expandedDate === dateStr ? null : dateStr)
  }

  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]

  const surgeryColors = [
    "bg-blue-100 border-blue-300",
    "bg-green-100 border-green-300",
    "bg-purple-100 border-purple-300",
    "bg-pink-100 border-pink-300",
    "bg-yellow-100 border-yellow-300",
    "bg-indigo-100 border-indigo-300",
  ]

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[160px] sm:min-h-[200px] lg:min-h-[240px]" />
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const daySurgeries = getSurgeriesForDay(day)
            const hasNotes = hasNotesForDay(day)
            const assignedDoctor = getAssignedDoctorForDay(day)
            const isSelected = selectedDate === dateStr
            const isToday = new Date().toISOString().split("T")[0] === dateStr
            const isDraggedOver = dragOver === dateStr

            const date = new Date(year, month, day)
            const dayOfWeek = date.getDay()
            const dayNameIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            const dayName = dayNames[dayNameIndex]

            return (
              <div
                key={day}
                className={cn(
                  "rounded-lg p-1 sm:p-1.5 md:p-2 cursor-pointer transition-all hover:shadow-lg relative min-h-[160px] sm:min-h-[200px] lg:min-h-[240px] flex flex-col border-2 gap-0 my-1 md:px-2 mx-1",
                  isSelected && "ring-2 ring-blue-500 bg-blue-50",
                  isToday && !isSelected && "bg-yellow-50 border-yellow-400",
                  !isSelected && !isToday && "bg-white hover:bg-gray-50",
                  isDraggedOver && "ring-2 ring-green-500 bg-green-50",
                )}
                onClick={() => onDateSelect(dateStr)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-0.5 sm:mb-1 flex-shrink-0">
                    <div className="flex flex-col gap-0 sm:gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "text-[10px] sm:text-xs lg:text-sm font-bold flex-shrink-0 leading-tight",
                            isToday && "text-yellow-700",
                            !isToday && "text-gray-800",
                          )}
                        >
                          {day} - {dayName}
                        </span>
                        {hasNotes && (
                          <div
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"
                            title="Not var"
                          />
                        )}
                      </div>
                      {assignedDoctor && (
                        <div className="text-[9px] sm:text-[10px] lg:text-xs text-blue-700 font-bold leading-tight break-words">
                          {assignedDoctor.doctor?.name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleCellExpansion(dateStr, e)}
                      className="text-gray-400 hover:text-gray-700 flex-shrink-0"
                    >
                      <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>

                  {!assignedDoctor && isAdmin && (
                    <Select onValueChange={(value) => handleDoctorAssign(day, value)} disabled={isAssigning}>
                      <SelectTrigger className="h-5 sm:h-6 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1 border-dashed">
                        <SelectValue placeholder="Hoca" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex-1 min-h-0 space-y-0.5 sm:space-y-1">
                    {daySurgeries.length > 0 && (
                      <Badge variant="secondary" className="text-[8px] sm:text-[9px] font-semibold mb-0.5 py-0">
                        {daySurgeries.length} vaka
                      </Badge>
                    )}
                    {daySurgeries.slice(0, 4).map((surgery, idx) => (
                      <div
                        key={surgery.id}
                        className={cn(
                          "text-[8px] sm:text-[9px] lg:text-[10px] font-medium text-gray-900 leading-tight px-0.5 sm:px-1 py-0.5 rounded border",
                          surgeryColors[idx % surgeryColors.length],
                          "md:line-clamp-1", // Only truncate on desktop
                        )}
                        title={surgery.procedure_name}
                      >
                        <div className="break-words">• {surgery.procedure_name}</div>
                      </div>
                    ))}
                    {daySurgeries.length > 4 && (
                      <div className="text-[8px] sm:text-[9px] text-gray-600 font-medium px-0.5 sm:px-1">
                        +{daySurgeries.length - 4} daha...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {expandedDate && (
        <Dialog open={!!expandedDate} onOpenChange={() => setExpandedDate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {new Date(expandedDate).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  weekday: "long",
                })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {getSurgeriesForDay(Number.parseInt(expandedDate.split("-")[2])).map((surgery) => (
                <Card key={surgery.id}>
                  <CardContent className="p-4">
                    <h4 className="font-bold text-blue-600 mb-2">{surgery.procedure_name}</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Hasta:</strong> {surgery.patient_name}
                      </p>
                      <p>
                        <strong>Protokol:</strong> {surgery.protocol_number}
                      </p>
                      <p>
                        <strong>Endikasyon:</strong> {surgery.indication}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { Doctor, SurgeryWithDetails, DayNote, DailyAssignedDoctor } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignDoctorToDay } from "@/lib/actions/notes"
import { assignFromWaitingList, deleteSurgery } from "@/lib/actions/surgeries"
import { useState } from "react"
import { Maximize2, Trash2, Edit } from "lucide-react"
import { getDoctorColorById } from "@/components/doctor-filter"
import { Button } from "@/components/ui/button"
import { SurgeryFormEdit } from "@/components/surgery-form-edit"

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
  filteredDoctors?: string[]
  highlightedDate?: string | null // Added highlightedDate prop for patient search navigation
  currentMonth: number
  currentYear: number
  onDateClick: (date: string) => void
  salons: any[]
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
  filteredDoctors = [],
  highlightedDate = null, // Accept highlightedDate prop
  currentMonth,
  currentYear,
  onDateClick,
  salons,
}: MonthlyCalendarProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingSurgery, setEditingSurgery] = useState<SurgeryWithDetails | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []

  let offset = 0
  if (firstDay === 0) {
    offset = 0
  } else if (firstDay === 6) {
    offset = 0
  } else {
    offset = firstDay - 1
  }

  for (let i = 0; i < offset; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const dayOfWeek = date.getDay()
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

  const getFilteredDoctorHighlight = (day: number) => {
    if (filteredDoctors.length === 0) return null
    const assignedDoctor = getAssignedDoctorForDay(day)
    if (!assignedDoctor) return null
    const doctorId = assignedDoctor.doctor_id
    if (filteredDoctors.includes(doctorId)) {
      return getDoctorColorById(doctorId, filteredDoctors)
    }
    return null
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
      return
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    try {
      await assignFromWaitingList(surgeryId, salonId, dateStr)

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
  const dayNamesShort = ["Pzt", "Sal", "Çar", "Per", "Cum"]

  const surgeryColors = [
    "bg-blue-100 dark:bg-blue-700/70 border-blue-300 dark:border-blue-500 text-blue-900 dark:text-blue-50",
    "bg-green-100 dark:bg-green-700/70 border-green-300 dark:border-green-500 text-green-900 dark:text-green-50",
    "bg-purple-100 dark:bg-purple-700/70 border-purple-300 dark:border-purple-500 text-purple-900 dark:text-purple-50",
    "bg-pink-100 dark:bg-pink-700/70 border-pink-300 dark:border-pink-500 text-pink-900 dark:text-pink-50",
    "bg-yellow-100 dark:bg-yellow-700/70 border-yellow-300 dark:border-yellow-500 text-yellow-900 dark:text-yellow-50",
    "bg-indigo-100 dark:bg-indigo-700/70 border-indigo-300 dark:border-indigo-500 text-indigo-900 dark:text-indigo-50",
  ]

  const handleDeleteSurgery = async (surgeryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Bu hastayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return
    }

    try {
      await deleteSurgery(surgeryId)
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Hasta silinirken bir hata oluştu")
    }
  }

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
            const doctorHighlight = getFilteredDoctorHighlight(day)
            const isHighlighted = highlightedDate === dateStr // Check if this date is highlighted from patient search

            const date = new Date(year, month, day)
            const dayOfWeek = date.getDay()
            const dayNameIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            const dayName = dayNames[dayNameIndex]
            const dayNameShort = dayNamesShort[dayNameIndex]

            return (
              <div
                key={day}
                className={cn(
                  "rounded-lg p-1 sm:p-1.5 md:p-2 cursor-pointer transition-all hover:shadow-lg relative min-h-[160px] sm:min-h-[200px] lg:min-h-[240px] flex flex-col border-2 gap-0 my-1 md:px-2 mx-1",
                  isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
                  isToday && !isSelected && "bg-yellow-50 dark:bg-yellow-950 border-yellow-400",
                  !isSelected && !isToday && !doctorHighlight && "bg-card hover:bg-muted",
                  isDraggedOver && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950",
                  doctorHighlight && !isSelected && `${doctorHighlight.bg} ${doctorHighlight.border} border-2`,
                  isHighlighted && "ring-4 ring-purple-500 animate-pulse",
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
                            isToday && "text-yellow-700 dark:text-yellow-300",
                            doctorHighlight && doctorHighlight.text,
                            !isToday && !doctorHighlight && "text-foreground",
                          )}
                        >
                          <span className="hidden sm:inline">
                            {day} - {dayName}
                          </span>
                          <span className="inline sm:hidden">
                            {day} - {dayNameShort}
                          </span>
                        </span>
                        {hasNotes && (
                          <div
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"
                            title="Not var"
                          />
                        )}
                      </div>
                      {assignedDoctor && (
                        <div
                          className={cn(
                            "text-[9px] sm:text-[10px] lg:text-xs font-bold leading-tight break-words",
                            doctorHighlight ? doctorHighlight.text : "text-blue-700 dark:text-blue-300",
                          )}
                        >
                          {assignedDoctor.doctor?.name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleCellExpansion(dateStr, e)}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>

                  {!assignedDoctor && (
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
                          "text-[8px] sm:text-[9px] lg:text-[10px] font-medium leading-tight px-0.5 sm:px-1 py-0.5 rounded border",
                          surgeryColors[idx % surgeryColors.length],
                          "md:line-clamp-1",
                        )}
                        title={surgery.procedure_name}
                      >
                        <div className="break-words">• {surgery.procedure_name}</div>
                      </div>
                    ))}
                    {daySurgeries.length > 4 && (
                      <div className="text-[8px] sm:text-[9px] text-muted-foreground font-medium px-0.5 sm:px-1">
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
            <div className="space-y-4">
              {dayNotes.filter((note) => note.note_date === expandedDate).length > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-lg text-amber-700 dark:text-amber-400 mb-3">📝 Gün Notları</h4>
                    <div className="space-y-2">
                      {dayNotes
                        .filter((note) => note.note_date === expandedDate)
                        .map((dayNote) => (
                          <div key={dayNote.id} className="bg-white dark:bg-amber-900/30 rounded p-3 text-sm">
                            <p className="whitespace-pre-wrap text-amber-900 dark:text-amber-100">{dayNote.note}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                              {new Date(dayNote.created_at).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {getSurgeriesForDay(Number.parseInt(expandedDate.split("-")[2])).map((surgery) => (
                <Card key={surgery.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400">{surgery.procedure_name}</h4>
                      <div className="flex items-center gap-2">
                        {surgery.is_approved && (
                          <Badge variant="default" className="bg-green-600">
                            Onaylandı
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("[v0] Edit button clicked, surgery:", surgery.id)
                            setEditingSurgery(surgery)
                          }}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="Hastayı Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => handleDeleteSurgery(surgery.id, e)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          title="Hastayı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Hasta Adı</p>
                          <p className="font-semibold">{surgery.patient_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Protokol No</p>
                          <p className="font-semibold">{surgery.protocol_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Telefon 1</p>
                          <p className="font-medium">{surgery.phone_number_1 || "-"}</p>
                        </div>
                        {surgery.phone_number_2 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Telefon 2</p>
                            <p className="font-medium">{surgery.phone_number_2}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Endikasyon</p>
                          <p className="font-medium">{surgery.indication}</p>
                        </div>
                        {surgery.responsible_doctor && (
                          <div>
                            <p className="text-xs text-muted-foreground">Sorumlu Hoca</p>
                            <p className="font-semibold text-blue-600 dark:text-blue-400">
                              {surgery.responsible_doctor.name}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Ameliyat Tarihi</p>
                          <p className="font-medium">
                            {surgery.surgery_date ? new Date(surgery.surgery_date).toLocaleDateString("tr-TR") : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {surgery.surgery_notes && surgery.surgery_notes.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Notlar</p>
                        <div className="space-y-2">
                          {surgery.surgery_notes.map((note) => (
                            <div key={note.id} className="bg-muted/50 rounded p-2 text-sm">
                              <p className="whitespace-pre-wrap">{note.note}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.created_at).toLocaleDateString("tr-TR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingSurgery && (
        <SurgeryFormEdit
          surgery={editingSurgery}
          doctors={doctors}
          salons={salons}
          open={!!editingSurgery}
          onOpenChange={(open) => {
            if (!open) {
              setEditingSurgery(null)
            }
          }}
          onSuccess={() => {
            setEditingSurgery(null)
            onDataChange() // Refresh data without page reload
            setExpandedDate(null)
          }}
        />
      )}
    </>
  )
}

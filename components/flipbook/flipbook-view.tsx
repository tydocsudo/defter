"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Home, StickyNote, Edit, List, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Salon, SurgeryWithDetails, DayNote, SurgeryNote, Doctor } from "@/lib/types"
import Link from "next/link"
import { SurgeryFormEdit } from "@/components/surgery-form-edit"
import { moveToWaitingList } from "@/lib/actions/surgeries"
import { createDayNote, deleteDayNote } from "@/lib/actions/notes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

interface SurgeryWithNotes extends SurgeryWithDetails {
  surgery_notes?: SurgeryNote[]
}

interface FlipbookViewProps {
  salons: Salon[]
  surgeries: SurgeryWithNotes[]
  dayNotes: DayNote[]
  doctors: Doctor[]
}

export function FlipbookView({ salons, surgeries, dayNotes, doctors }: FlipbookViewProps) {
  const [selectedSalonId, setSelectedSalonId] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState<SurgeryWithNotes | null>(null)
  const [newDayNote, setNewDayNote] = useState("")
  const [isAddingDayNote, setIsAddingDayNote] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (salons.length > 0 && !selectedSalonId) {
      setSelectedSalonId(salons[0].id)
    }
  }, [salons, selectedSalonId])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextPage = useCallback(() => {
    if (currentPageIndex < daysInMonth.length - 1 && !isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev + 1)
        setIsFlipping(false)
      }, 600)
    }
  }, [currentPageIndex, daysInMonth.length, isFlipping])

  const prevPage = useCallback(() => {
    if (currentPageIndex > 0 && !isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev - 1)
        setIsFlipping(false)
      }, 600)
    }
  }, [currentPageIndex, isFlipping])

  const jumpToDate = useCallback((date: Date) => {
    const targetMonth = startOfMonth(date)
    const targetMonthEnd = endOfMonth(date)

    setCurrentMonth(targetMonth)

    const daysInTargetMonth = eachDayOfInterval({ start: targetMonth, end: targetMonthEnd })
    const dayIndex = daysInTargetMonth.findIndex((d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))

    if (dayIndex !== -1) {
      setCurrentPageIndex(dayIndex)
    }
    setIsCalendarOpen(false)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setDragStart(e.clientX - rect.left)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart !== null && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const offset = e.clientX - rect.left - dragStart
      setDragOffset(Math.max(-200, Math.min(200, offset)))
    }
  }

  const handleMouseUp = () => {
    if (dragStart !== null) {
      if (dragOffset > 100) {
        prevPage()
      } else if (dragOffset < -100) {
        nextPage()
      }
      setDragStart(null)
      setDragOffset(0)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevPage()
      } else if (e.key === "ArrowRight") {
        nextPage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [prevPage, nextPage])

  const handleMoveToWaitingList = async (surgeryId: string) => {
    if (confirm("Bu hastayı bekleme listesine taşımak istediğinize emin misiniz?")) {
      try {
        await moveToWaitingList(surgeryId)
        window.location.reload()
      } catch (error: any) {
        alert(error.message || "Hasta bekleme listesine taşınırken bir hata oluştu")
      }
    }
  }

  const handleAddDayNote = async () => {
    if (!newDayNote.trim() || !selectedSalonId || !currentDateKey) return

    setIsAddingDayNote(true)
    try {
      await createDayNote(selectedSalonId, currentDateKey, newDayNote)
      setNewDayNote("")
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Not eklenirken bir hata oluştu")
    } finally {
      setIsAddingDayNote(false)
    }
  }

  const handleDeleteDayNote = async (noteId: string) => {
    if (!confirm("Bu notu silmek istediğinizden emin misiniz?")) return

    try {
      await deleteDayNote(noteId)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Not silinirken bir hata oluştu")
    }
  }

  const currentDay = daysInMonth[currentPageIndex]
  const currentDateKey = currentDay ? format(currentDay, "yyyy-MM-dd") : ""
  const currentSurgeries = surgeries.filter(
    (surgery) => surgery.surgery_date === currentDateKey && surgery.salon_id === selectedSalonId,
  )

  const currentDayNotes = dayNotes.filter(
    (note) => note.note_date === currentDateKey && note.salon_id === selectedSalonId,
  )

  const currentDayDoctors = [...new Set(currentSurgeries.map((s) => s.responsible_doctor?.name).filter(Boolean))]

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b shadow-lg p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold">Ameliyat Defteri</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <Home className="h-4 w-4" />
                  Anasayfa
                </Button>
              </Link>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  >
                    <Calendar className="h-4 w-4" />
                    Tarihe Git
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <MiniCalendar currentDate={currentDay} onSelectDate={jumpToDate} />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[180px] text-center font-semibold">
                  {format(currentMonth, "MMMM yyyy", { locale: tr })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Select value={selectedSalonId} onValueChange={setSelectedSalonId}>
                <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Salon Seçin" />
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
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-full max-w-5xl h-[600px]">
          <div
            ref={cardRef}
            className={`absolute inset-0 transition-all duration-600 ${
              isFlipping ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{
              transformStyle: "preserve-3d",
              perspective: "1000px",
              transform: dragStart !== null ? `translateX(${dragOffset}px) rotateY(${dragOffset * 0.1}deg)` : undefined,
              cursor: dragStart !== null ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Card className="w-full h-full shadow-2xl overflow-hidden bg-white">
              <div className="bg-primary text-primary-foreground p-6 border-b">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {currentDay && format(currentDay, "d MMMM yyyy EEEE", { locale: tr })}
                        </h2>
                        <p className="text-sm opacity-90 mt-1">{salons.find((s) => s.id === selectedSalonId)?.name}</p>
                        {currentDayDoctors.length > 0 && (
                          <p className="text-sm opacity-90 mt-1">Hocalar: {currentDayDoctors.join(", ")}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{currentPageIndex + 1}</div>
                        <div className="text-sm opacity-90">/ {daysInMonth.length}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
                      <StickyNote className="h-4 w-4 flex-shrink-0" />
                      <Textarea
                        placeholder="Gün notu ekleyin..."
                        value={newDayNote}
                        onChange={(e) => setNewDayNote(e.target.value)}
                        rows={1}
                        className="flex-1 text-sm bg-transparent border-0 text-white placeholder:text-white/60 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddDayNote}
                        disabled={isAddingDayNote || !newDayNote.trim()}
                        className="bg-white/20 hover:bg-white/30 text-white flex-shrink-0 h-8"
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 h-[calc(100%-120px)] overflow-auto">
                {currentDayNotes.length > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-amber-900">Günlük Notlar</h3>
                    </div>
                    <div className="space-y-2">
                      {currentDayNotes.map((note) => (
                        <div
                          key={note.id}
                          className="text-sm text-amber-800 pl-7 flex items-start justify-between group"
                        >
                          <span>• {note.note}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteDayNote(note.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSurgeries.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg">Bu gün için ameliyat bulunmamaktadır</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSurgeries.map((surgery, index) => (
                      <div key={surgery.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-sm text-muted-foreground">Hasta Adı</div>
                                <div className="font-semibold">{surgery.patient_name}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Protokol No</div>
                                <div className="font-semibold">{surgery.protocol_number}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Endikasyon</div>
                                <div>{surgery.indication}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">İşlem</div>
                                <div>{surgery.procedure_name}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Sorumlu Hoca</div>
                                <div>{surgery.responsible_doctor?.name || "-"}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Telefon</div>
                                <div className="font-mono text-sm">
                                  {surgery.phone_number_1}
                                  {surgery.phone_number_2 && ` / ${surgery.phone_number_2}`}
                                </div>
                              </div>
                            </div>

                            {surgery.surgery_notes && surgery.surgery_notes.length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  <StickyNote className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-blue-900">Hasta Notları:</span>
                                </div>
                                <div className="space-y-1">
                                  {surgery.surgery_notes.map((note) => (
                                    <div key={note.id} className="text-sm text-blue-800 pl-6">
                                      • {note.note}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <List className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSurgery(surgery)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveToWaitingList(surgery.id)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Bekleme Listesine Taşı
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="absolute -left-20 top-1/2 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg bg-white"
              onClick={prevPage}
              disabled={currentPageIndex === 0 || isFlipping}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          </div>

          <div className="absolute -right-20 top-1/2 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg bg-white"
              onClick={nextPage}
              disabled={currentPageIndex === daysInMonth.length - 1 || isFlipping}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Sayfa çevirmek için yan ok tuşlarını ← → veya mouse ile sürükleyebilirsiniz</span>
        </div>
      </div>

      {editingSurgery && (
        <SurgeryFormEdit
          surgery={editingSurgery}
          doctors={doctors}
          open={!!editingSurgery}
          onOpenChange={(open) => !open && setEditingSurgery(null)}
          onSuccess={() => {
            setEditingSurgery(null)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

function MiniCalendar({ currentDate, onSelectDate }: { currentDate: Date; onSelectDate: (date: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(currentDate || new Date())

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array(firstDayOfWeek).fill(null)

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">{format(viewMonth, "MMMM yyyy", { locale: tr })}</div>
        <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {daysInMonth.map((day) => {
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
          const isSelected = currentDate && format(day, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")

          return (
            <Button
              key={day.toISOString()}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 font-normal",
                isToday && "border border-primary",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => onSelectDate(day)}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

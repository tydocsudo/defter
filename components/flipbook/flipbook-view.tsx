"use client"

import type React from "react"
import {
  subMonths,
  addMonths,
  startOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
  isValid,
} from "date-fns" // Import subMonths and addMonths
import { useState, useEffect, useCallback, useRef } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Home,
  StickyNote,
  Edit,
  List,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Salon, SurgeryWithDetails, DayNote, SurgeryNote, Doctor } from "@/lib/types"
import Link from "next/link"
import { moveToWaitingList, assignFromWaitingList } from "@/lib/actions/surgeries"
import { createDayNote, deleteDayNote, createSurgeryNote, deleteSurgeryNote } from "@/lib/actions/notes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { WaitingListSidebar } from "@/components/calendar/waiting-list-sidebar"
import { approveSurgery, unapproveSurgery } from "@/lib/actions/surgeries"
import { FlipbookOperationsList } from "./flipbook-operations-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SurgeryWithNotes extends SurgeryWithDetails {
  surgery_notes?: SurgeryNote[]
}

interface FlipbookViewProps {
  salons: Salon[]
  surgeries: SurgeryWithNotes[]
  dayNotes: DayNote[]
  doctors: Doctor[]
  initialDate?: string // Added initialDate prop to scroll to specific date
}

export function FlipbookView({ salons, surgeries, dayNotes, doctors, initialDate }: FlipbookViewProps) {
  const [selectedSalonId, setSelectedSalonId] = useState<string>("")
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [isFlipping, setIsFlipping] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState<SurgeryWithNotes | null>(null)
  const [newDayNote, setNewDayNote] = useState("")
  const [selectedDayForNote, setSelectedDayForNote] = useState<string>("")
  const [isAddingDayNote, setIsAddingDayNote] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [selectedDayForList, setSelectedDayForList] = useState<Date | null>(new Date()) // Track selected day for operations list
  const [showOperationsList, setShowOperationsList] = useState(false) // Toggle visibility
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedSurgeryForNote, setSelectedSurgeryForNote] = useState<string | null>(null)
  const [surgeryNote, setSurgeryNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const [isDeletingNote, setIsDeletingNote] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasScrolledToInitialDate = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (salons.length > 0 && !selectedSalonId) {
      setSelectedSalonId(salons[0].id)
    }
  }, [salons, selectedSalonId])

  useEffect(() => {
    if (initialDate && !hasScrolledToInitialDate.current) {
      try {
        const targetDate = parseISO(initialDate)
        if (isValid(targetDate)) {
          const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
          setCurrentWeekStart(weekStart)
          hasScrolledToInitialDate.current = true
          console.log("[v0] Scrolled to week containing:", initialDate)

          // Clear the date parameter from URL after scrolling
          router.replace("/fliphtml", { scroll: false })
        }
      } catch (error) {
        console.error("[v0] Error parsing initialDate:", error)
      }
    }
  }, [initialDate, router])

  const getWeekDays = (start: Date) => {
    return eachDayOfInterval({ start, end: addDays(start, 4) }) // Mon-Fri
  }

  const weekDays = getWeekDays(currentWeekStart)
  const weekEnd = addDays(currentWeekStart, 4)
  const weekSurgeries = surgeries.filter((s) => {
    if (!s.surgery_date) return false
    const surgeryDate = new Date(s.surgery_date)
    return surgeryDate >= currentWeekStart && surgeryDate <= weekEnd
  })

  const nextWeek = useCallback(() => {
    if (!isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentWeekStart((prev) => addWeeks(prev, 1))
        setIsFlipping(false)
      }, 600)
    }
  }, [isFlipping])

  const prevWeek = useCallback(() => {
    if (!isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentWeekStart((prev) => subWeeks(prev, 1))
        setIsFlipping(false)
      }, 600)
    }
  }, [isFlipping])

  const jumpToDate = useCallback((date: Date) => {
    setCurrentWeekStart(date)
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
        prevWeek()
      } else if (dragOffset < -100) {
        nextWeek()
      }
      setDragStart(null)
      setDragOffset(0)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevWeek()
      } else if (e.key === "ArrowRight") {
        nextWeek()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [prevWeek, nextWeek])

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
    if (!newDayNote.trim() || !selectedSalonId || !selectedDayForNote) return

    setIsAddingDayNote(true)
    try {
      await createDayNote(selectedSalonId, selectedDayForNote, newDayNote)
      setNewDayNote("")
      setSelectedDayForNote("")
      router.refresh()
    } catch (error: any) {
      alert(`Not eklenirken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`)
    } finally {
      setIsAddingDayNote(false)
    }
  }

  const handleDeleteDayNote = async (noteId: string) => {
    if (!confirm("Bu notu silmek istediğinizden emin misiniz?")) return

    try {
      await deleteDayNote(noteId)
      router.refresh()
    } catch (error: any) {
      alert(`Not silinirken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`)
    }
  }

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTarget(dateKey)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = async (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    const surgeryId = e.dataTransfer.getData("surgeryId")

    if (surgeryId && selectedSalonId) {
      try {
        await assignFromWaitingList(surgeryId, selectedSalonId, dateKey)
        setDropTarget(null)
        window.dispatchEvent(new Event("waitingListChanged"))
        router.refresh()
      } catch (error: any) {
        alert(error.message || "Atama yapılırken bir hata oluştu")
      }
    }
  }

  const getSurgeriesForDay = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd")
    return surgeries.filter((surgery) => surgery.surgery_date === dateKey && surgery.salon_id === selectedSalonId)
  }

  const getDayNotesForDay = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd")
    return dayNotes.filter((note) => note.note_date === dateKey && note.salon_id === selectedSalonId)
  }

  const handleApprove = async (surgeryId: string, isApproved: boolean) => {
    try {
      if (isApproved) {
        await unapproveSurgery(surgeryId)
      } else {
        await approveSurgery(surgeryId)
      }
      window.location.reload()
    } catch (error: any) {
      alert(`Onay güncellenirken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`)
    }
  }

  const handleDragStart = (e: React.DragEvent, surgeryId: string) => {
    e.dataTransfer.setData("surgeryId", surgeryId)
  }

  const handleDataChange = () => {
    router.refresh()
  }

  const handleAddNote = async () => {
    if (!selectedSurgeryForNote || !surgeryNote.trim()) return

    setIsAddingNote(true)
    try {
      await createSurgeryNote(selectedSurgeryForNote, surgeryNote)
      setSurgeryNote("")
      setSelectedSurgeryForNote(null)
      setNoteDialogOpen(false)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Not eklenirken bir hata oluştu")
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return

    setIsDeletingNote(true)
    try {
      await deleteSurgeryNote(deleteNoteId)
      setDeleteNoteId(null)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Not silinirken bir hata oluştu")
    } finally {
      setIsDeletingNote(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b shadow-lg p-3 md:p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Title and Home button */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              <h1 className="text-lg md:text-2xl font-bold">Ameliyat Defteri</h1>
              <Link href="/" className="ml-auto md:ml-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Anasayfa</span>
                </Button>
              </Link>
            </div>

            {/* Navigation controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              {/* Date picker button */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white w-full sm:w-auto"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Tarihe Git</span>
                    <span className="sm:hidden">Tarih</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <MiniCalendar currentDate={currentWeekStart} onSelectDate={jumpToDate} />
                </PopoverContent>
              </Popover>

              {/* Week navigation */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevWeek}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white h-8 w-8 md:h-9 md:w-9"
                  disabled={isFlipping}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs md:text-sm text-center font-semibold whitespace-nowrap">
                  {format(currentWeekStart, "d MMM", { locale: tr })} -{" "}
                  {format(weekDays[4], "d MMM yyyy", { locale: tr })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextWeek}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white h-8 w-8 md:h-9 md:w-9"
                  disabled={isFlipping}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Salon selector */}
              <Select value={selectedSalonId} onValueChange={setSelectedSalonId}>
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] bg-white/10 border-white/20 text-white text-sm">
                  <SelectValue placeholder="Salon" />
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

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <div
            ref={cardRef}
            className={`grid grid-cols-1 md:grid-cols-5 gap-4 transition-all duration-600 ${
              isFlipping ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{
              transform: dragStart !== null ? `translateX(${dragOffset}px)` : undefined,
              cursor: dragStart !== null ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {weekDays.map((day) => {
              const daySurgeries = getSurgeriesForDay(day)
              const dayNotesForDay = getDayNotesForDay(day)
              const dateKey = format(day, "yyyy-MM-dd")
              const dayDoctors = [...new Set(daySurgeries.map((s) => s.responsible_doctor?.name).filter(Boolean))]
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
              const isDropTarget = dropTarget === dateKey

              return (
                <Card
                  key={dateKey}
                  onDragOver={(e) => handleDragOver(e, dateKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateKey)}
                  className={cn(
                    "flex flex-col shadow-lg overflow-hidden transition-all",
                    isToday && "ring-2 ring-blue-500",
                    isDropTarget && "ring-2 ring-green-500 bg-green-50",
                  )}
                >
                  {/* Day header */}
                  <div className="bg-primary text-primary-foreground p-3 border-b">
                    <h3 className="font-bold text-lg">{format(day, "EEEE", { locale: tr })}</h3>
                    <p className="text-sm opacity-90">{format(day, "d MMMM yyyy", { locale: tr })}</p>
                    {dayDoctors.length > 0 && (
                      <p className="text-xs opacity-75 mt-1">Hocalar: {dayDoctors.join(", ")}</p>
                    )}
                  </div>

                  {/* Day content */}
                  <div className="flex-1 p-3 overflow-auto">
                    {/* Day notes section */}
                    {dayNotesForDay.length > 0 && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <StickyNote className="h-3 w-3 text-amber-600" />
                          <span className="font-semibold text-amber-900">Notlar</span>
                        </div>
                        <div className="space-y-1">
                          {dayNotesForDay.map((note) => (
                            <div key={note.id} className="text-amber-800 flex items-start justify-between group">
                              <span className="text-xs">• {note.note}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteDayNote(note.id)}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add day note button */}
                    <div className="mb-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-7 bg-transparent"
                            onClick={() => setSelectedDayForNote(dateKey)}
                          >
                            <StickyNote className="h-3 w-3 mr-1" />
                            Not Ekle
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3">
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Gün notu..."
                              value={selectedDayForNote === dateKey ? newDayNote : ""}
                              onChange={(e) => setNewDayNote(e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={handleAddDayNote}
                              disabled={isAddingDayNote || !newDayNote.trim() || selectedDayForNote !== dateKey}
                              className="w-full"
                            >
                              Ekle
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Surgeries list */}
                    {daySurgeries.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <p className="text-xs">Ameliyat yok</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySurgeries.map((surgery, index) => (
                          <div
                            key={surgery.id}
                            className="border rounded p-2 hover:bg-slate-50 transition-colors text-xs relative"
                            onDragStart={(e) => handleDragStart(e, surgery.id)}
                            draggable
                          >
                            {surgery.is_approved && (
                              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5 z-10">
                                <Check className="h-3 w-3" />
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-1 pr-6">
                                <div className="font-semibold">{surgery.patient_name}</div>
                                <div className="text-muted-foreground text-xs">{surgery.protocol_number}</div>
                                <div className="text-xs">{surgery.indication}</div>
                                <div className="text-xs text-blue-600">{surgery.procedure_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {surgery.responsible_doctor?.name || "-"}
                                </div>
                                <div className="font-mono text-xs text-muted-foreground">{surgery.phone_number_1}</div>
                                {surgery.creator && (
                                  <div className="text-xs text-gray-500">
                                    Ekleyen: {surgery.creator.first_name} {surgery.creator.last_name}
                                  </div>
                                )}

                                {surgery.surgery_notes && surgery.surgery_notes.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {surgery.surgery_notes.map((note) => (
                                      <div
                                        key={note.id}
                                        className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start justify-between gap-2"
                                      >
                                        <div className="flex-1">
                                          <p className="text-gray-700">{note.note}</p>
                                          <p className="text-gray-400 text-[10px] mt-1">
                                            {new Date(note.created_at).toLocaleDateString("tr-TR", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => setDeleteNoteId(note.id)}
                                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                          title="Notu sil"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-8">
                                    <List className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingSurgery(surgery)}>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleApprove(surgery.id, surgery.is_approved)}>
                                    {surgery.is_approved ? (
                                      <>
                                        <X className="h-3 w-3 mr-2" />
                                        Onayı Kaldır
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3 mr-2" />
                                        Onayla
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSurgeryForNote(surgery.id)
                                      setNoteDialogOpen(true)
                                    }}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-2" />
                                    Not Ekle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMoveToWaitingList(surgery.id)}>
                                    <Calendar className="h-3 w-3 mr-2" />
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
              )
            })}
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-4">
            <WaitingListSidebar salons={salons} doctors={doctors} onDataChange={handleDataChange} layout="horizontal" />
          </div>

          <div className="bg-white rounded-lg border shadow-sm">
            <Button
              variant="ghost"
              onClick={() => setShowOperationsList(!showOperationsList)}
              className="w-full py-3 flex items-center justify-center gap-2"
            >
              {showOperationsList ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Günlük Listeyi Gizle
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Günlük Listeyi Göster
                  {selectedDayForList && ` - ${format(selectedDayForList, "d MMM", { locale: tr })}`}
                </>
              )}
            </Button>

            {showOperationsList && selectedDayForList && (
              <div className="p-4">
                <FlipbookOperationsList
                  selectedDate={selectedDayForList}
                  surgeries={surgeries}
                  doctors={doctors}
                  salons={salons}
                  onDataChange={handleDataChange}
                  weekDays={weekDays}
                  onDateChange={setSelectedDayForList}
                  selectedSalonId={selectedSalonId}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hasta Notu Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Not girin..."
              value={surgeryNote}
              onChange={(e) => setSurgeryNote(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNoteDialogOpen(false)
                  setSelectedSurgeryForNote(null)
                  setSurgeryNote("")
                }}
              >
                İptal
              </Button>
              <Button onClick={handleAddNote} disabled={isAddingNote || !surgeryNote.trim()}>
                {isAddingNote ? "Ekleniyor..." : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz. Not kalıcı olarak silinecektir.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              disabled={isDeletingNote}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingNote ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

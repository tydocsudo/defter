"use client"

import { useState } from "react"
import type { SurgeryWithDetails, DayNote, Doctor, Salon } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createDayNote, deleteDayNote } from "@/lib/actions/notes"
import { X, MessageSquarePlus } from "lucide-react"
import { formatDateTurkish } from "@/lib/utils"

interface DayDetailsPanelProps {
  selectedDate: string | null
  salonId: string
  surgeries: SurgeryWithDetails[]
  dayNotes: DayNote[]
  doctors: Doctor[]
  salons: Salon[]
  onDataChange: () => void
}

export function DayDetailsPanel({
  selectedDate,
  salonId,
  surgeries,
  dayNotes,
  doctors,
  salons,
  onDataChange,
}: DayDetailsPanelProps) {
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  if (!selectedDate) {
    return (
      <Card className="w-80 hidden lg:block">
        <CardHeader>
          <CardTitle className="text-base">Gün Notları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">Detayları görmek için bir gün seçin</p>
        </CardContent>
      </Card>
    )
  }

  const daySurgeries = surgeries.filter((s) => s.surgery_date === selectedDate)
  const dateNotes = dayNotes.filter((n) => n.note_date === selectedDate)

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsAddingNote(true)
    try {
      await createDayNote(salonId, selectedDate, newNote)
      setNewNote("")
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Not eklenirken bir hata oluştu")
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Bu notu silmek istediğinizden emin misiniz?")) return

    try {
      await deleteDayNote(noteId)
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Not silinirken bir hata oluştu")
    }
  }

  return (
    <Card className="w-80 hidden lg:block">
      <CardHeader>
        <CardTitle className="text-base">{selectedDate ? formatDateTurkish(selectedDate) : "Gün Notları"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2">Ameliyatlar ({daySurgeries.length})</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {daySurgeries.map((surgery) => (
                <div key={surgery.id} className="p-2 bg-gray-50 rounded-md text-xs space-y-1">
                  <div className="font-semibold">{surgery.patient_name}</div>
                  <div className="text-gray-600">{surgery.procedure_name}</div>
                  {surgery.creator && (
                    <div className="text-gray-500">
                      Ekleyen: {surgery.creator.first_name} {surgery.creator.last_name}
                    </div>
                  )}
                </div>
              ))}
              {daySurgeries.length === 0 && <p className="text-gray-500 text-center py-4">Ameliyat yok</p>}
            </div>
          </ScrollArea>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">Gün Notları</h4>
          <div className="space-y-2 mb-3">
            <Textarea
              placeholder="Yeni not ekle..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={isAddingNote || !newNote.trim()}
              className="w-full gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Not Ekle
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {dateNotes.map((note) => (
                <div key={note.id} className="p-2 bg-blue-50 rounded-md text-xs relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="pr-6">{note.note}</div>
                  {note.creator && (
                    <div className="text-gray-500 mt-1">
                      {note.creator.first_name} {note.creator.last_name}
                    </div>
                  )}
                  <div className="text-gray-400 text-[10px] mt-1">
                    {new Date(note.created_at).toLocaleString("tr-TR")}
                  </div>
                </div>
              ))}
              {dateNotes.length === 0 && <p className="text-gray-500 text-center py-4">Not yok</p>}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

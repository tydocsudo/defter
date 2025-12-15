"use client"

import { useState } from "react"
import type { SurgeryWithDetails, DayNote, Doctor, Salon } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { deleteSurgery, moveToWaitingList } from "@/lib/actions/surgeries"
import { createSurgeryNote } from "@/lib/actions/notes"
import { MoreHorizontal, Trash2, MessageSquare, ListX, FileDown, Edit } from "lucide-react"
import { formatDateTurkish } from "@/lib/utils"
import { SurgeryFormEdit } from "@/components/surgery-form-edit"

interface DailyOperationsListProps {
  date: string
  salonId: string
  salon: Salon | undefined
  surgeries: SurgeryWithDetails[]
  dayNotes: DayNote[]
  doctors: Doctor[]
  salons: Salon[]
  onDataChange: () => void
}

export function DailyOperationsList({
  date,
  salonId,
  salon,
  surgeries,
  dayNotes,
  doctors,
  salons,
  onDataChange,
}: DailyOperationsListProps) {
  const [selectedSurgery, setSelectedSurgery] = useState<string | null>(null)
  const [editingSurgery, setEditingSurgery] = useState<SurgeryWithDetails | null>(null)
  const [surgeryNote, setSurgeryNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleDelete = async (surgeryId: string) => {
    if (!confirm("Bu ameliyatı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return
    }

    try {
      await deleteSurgery(surgeryId)
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Ameliyat silinirken bir hata oluştu")
    }
  }

  const handleMoveToWaitingList = async (surgeryId: string) => {
    if (!confirm("Bu ameliyatı bekleme listesine almak istediğinizden emin misiniz?")) {
      return
    }

    try {
      await moveToWaitingList(surgeryId)
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Ameliyat bekleme listesine alınırken bir hata oluştu")
    }
  }

  const handleAddSurgeryNote = async () => {
    if (!selectedSurgery || !surgeryNote.trim()) return

    setIsAddingNote(true)
    try {
      await createSurgeryNote(selectedSurgery, surgeryNote)
      setSurgeryNote("")
      setSelectedSurgery(null)
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Not eklenirken bir hata oluştu")
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleExportPDF = () => {
    const url = `/api/pdf/daily-list?salon_id=${salonId}&date=${date}`
    window.open(url, "_blank")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>
              {salon?.name} - {formatDateTurkish(date)}
            </CardTitle>
            <Button onClick={handleExportPDF} className="gap-2">
              <FileDown className="h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {surgeries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Bu gün için ameliyat planlanmamış</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sıra</TableHead>
                    <TableHead>Hasta Adı</TableHead>
                    <TableHead className="hidden md:table-cell">Protokol No</TableHead>
                    <TableHead>Yapılacak İşlem</TableHead>
                    <TableHead className="hidden lg:table-cell">Sorumlu Hoca</TableHead>
                    <TableHead className="hidden md:table-cell">Telefon</TableHead>
                    <TableHead className="hidden lg:table-cell">Ekleyen</TableHead>
                    <TableHead className="hidden xl:table-cell">Son Düzenleyen</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surgeries.map((surgery, index) => (
                    <TableRow key={surgery.id}>
                      <TableCell className="font-bold">{index + 1}</TableCell>
                      <TableCell className="font-medium">{surgery.patient_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{surgery.protocol_number}</TableCell>
                      <TableCell className="max-w-xs">{surgery.procedure_name}</TableCell>
                      <TableCell className="hidden lg:table-cell">{surgery.responsible_doctor?.name || "-"}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        <div>{surgery.phone_number_1}</div>
                        <div className="text-gray-500">{surgery.phone_number_2}</div>
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {surgery.creator ? (
                          <div>
                            {surgery.creator.first_name} {surgery.creator.last_name}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm hidden xl:table-cell">
                        {surgery.updated_by && surgery.updated_by !== surgery.created_by ? (
                          <div className="text-blue-600">Güncellendi</div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingSurgery(surgery)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedSurgery(surgery.id)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Not Ekle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveToWaitingList(surgery.id)}>
                              <ListX className="h-4 w-4 mr-2" />
                              Bekleme Listesine Al
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(surgery.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingSurgery && (
        <SurgeryFormEdit
          surgery={editingSurgery}
          doctors={doctors}
          open={!!editingSurgery}
          onOpenChange={(open) => !open && setEditingSurgery(null)}
          onSuccess={onDataChange}
        />
      )}

      <Dialog open={!!selectedSurgery} onOpenChange={() => setSelectedSurgery(null)}>
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
              <Button variant="outline" onClick={() => setSelectedSurgery(null)}>
                İptal
              </Button>
              <Button onClick={handleAddSurgeryNote} disabled={isAddingNote || !surgeryNote.trim()}>
                {isAddingNote ? "Ekleniyor..." : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

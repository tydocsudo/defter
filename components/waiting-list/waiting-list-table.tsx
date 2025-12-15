"use client"

import { useState } from "react"
import type { SurgeryWithDetails, Doctor, Salon } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { assignFromWaitingList, deleteSurgery } from "@/lib/actions/surgeries"
import { Calendar, MoreHorizontal, Trash2, MessageSquare } from "lucide-react"
import { SurgeryForm } from "@/components/surgery-form"
import { Textarea } from "@/components/ui/textarea"
import { createSurgeryNote } from "@/lib/actions/notes"

interface WaitingListTableProps {
  surgeries: SurgeryWithDetails[]
  doctors: Doctor[]
  salons: Salon[]
}

export function WaitingListTable({ surgeries, doctors, salons }: WaitingListTableProps) {
  const [selectedSurgery, setSelectedSurgery] = useState<string | null>(null)
  const [assignSalonId, setAssignSalonId] = useState("")
  const [assignDate, setAssignDate] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedSurgeryForNote, setSelectedSurgeryForNote] = useState<string | null>(null)
  const [surgeryNote, setSurgeryNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleAssign = async () => {
    if (!selectedSurgery || !assignSalonId || !assignDate) return

    setIsAssigning(true)
    try {
      await assignFromWaitingList(selectedSurgery, assignSalonId, assignDate)
      setSelectedSurgery(null)
      setAssignSalonId("")
      setAssignDate("")
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Atama yapılırken bir hata oluştu")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDelete = async (surgeryId: string) => {
    if (!confirm("Bu hastayı bekleme listesinden silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      await deleteSurgery(surgeryId)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Hasta silinirken bir hata oluştu")
    }
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

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setIsAddFormOpen(true)}>Bekleme Listesine Hasta Ekle</Button>
      </div>

      {surgeries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Bekleme listesinde hasta yok</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hasta Adı</TableHead>
              <TableHead>Protokol No</TableHead>
              <TableHead>Yapılacak İşlem</TableHead>
              <TableHead>Sorumlu Hoca</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Ekleyen</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surgeries.map((surgery) => (
              <TableRow key={surgery.id}>
                <TableCell className="font-medium">{surgery.patient_name}</TableCell>
                <TableCell>{surgery.protocol_number}</TableCell>
                <TableCell className="max-w-xs">{surgery.procedure_name}</TableCell>
                <TableCell>{surgery.responsible_doctor?.name || "-"}</TableCell>
                <TableCell className="text-sm">
                  <div>{surgery.phone_number_1}</div>
                  <div className="text-gray-500">{surgery.phone_number_2}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {surgery.creator ? (
                    <div>
                      {surgery.creator.first_name} {surgery.creator.last_name}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-sm">{new Date(surgery.created_at).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedSurgery(surgery.id)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Takvime Ata
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSurgeryForNote(surgery.id)
                          setNoteDialogOpen(true)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Not Ekle
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
      )}

      <Dialog open={!!selectedSurgery} onOpenChange={() => setSelectedSurgery(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takvime Atama Yap</DialogTitle>
            <DialogDescription>Hastayı bir salon ve tarihe atayın</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign_salon">Salon</Label>
              <Select value={assignSalonId} onValueChange={setAssignSalonId}>
                <SelectTrigger id="assign_salon">
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
              <Label htmlFor="assign_date">Ameliyat Tarihi</Label>
              <Input id="assign_date" type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSurgery(null)} disabled={isAssigning}>
              İptal
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning || !assignSalonId || !assignDate}>
              {isAssigning ? "Atanıyor..." : "Ata"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <SurgeryForm
        open={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        doctors={doctors}
        salons={salons}
        isWaitingList={true}
      />
    </>
  )
}

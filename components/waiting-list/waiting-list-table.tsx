"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Calendar, MoreHorizontal, Trash2, MessageSquare, Wand2, AlertCircle } from "lucide-react"
import { SurgeryForm } from "@/components/surgery-form"
import { Textarea } from "@/components/ui/textarea"
import { createSurgeryNote } from "@/lib/actions/notes"
import { findAvailableDates } from "@/lib/actions/auto-scheduler"
import { AvailableSlotsDialog } from "@/components/waiting-list/available-slots-dialog"
import { Badge } from "@/components/ui/badge"

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
  const [autoFindDialogOpen, setAutoFindDialogOpen] = useState(false)
  const [selectedPatientForAutoFind, setSelectedPatientForAutoFind] = useState<string | null>(null)
  const [autoFindSalonId, setAutoFindSalonId] = useState("")
  const [autoFindDoctorId, setAutoFindDoctorId] = useState("")
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [isSearchingSlots, setIsSearchingSlots] = useState(false)
  const [autoFindStep, setAutoFindStep] = useState<"patient" | "salon" | "doctor" | "results">("patient")

  const router = useRouter()

  const handleAssign = async () => {
    if (!selectedSurgery || !assignSalonId || !assignDate) return

    setIsAssigning(true)
    try {
      await assignFromWaitingList(selectedSurgery, assignSalonId, assignDate)
      setSelectedSurgery(null)
      setAssignSalonId("")
      setAssignDate("")

      window.location.href = `/fliphtml?date=${assignDate}`
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

  const handleAutoFind = async () => {
    if (!selectedPatientForAutoFind || !autoFindSalonId || !autoFindDoctorId) {
      alert("Lütfen salon ve hoca seçin")
      return
    }

    setIsSearchingSlots(true)
    try {
      const result = await findAvailableDates(autoFindSalonId, autoFindDoctorId, selectedPatientForAutoFind)

      if (result.success && result.slots) {
        setAvailableSlots(result.slots)
        setAutoFindStep("results")
      } else {
        alert(result.error || "Uygun tarih bulunamadı")
        setAutoFindDialogOpen(false)
        setSelectedPatientForAutoFind(null)
        setAutoFindStep("patient")
      }
    } catch (error: any) {
      alert(error.message || "Tarihler aranırken hata oluştu")
    } finally {
      setIsSearchingSlots(false)
    }
  }

  const handleSelectSlot = async (date: string) => {
    if (!selectedPatientForAutoFind || !autoFindSalonId || !autoFindDoctorId) return

    setIsSearchingSlots(true)
    try {
      await assignFromWaitingList(selectedPatientForAutoFind, autoFindSalonId, date, autoFindDoctorId)
      setAutoFindDialogOpen(false)
      setSelectedPatientForAutoFind(null)
      setAutoFindSalonId("")
      setAutoFindDoctorId("")
      setAvailableSlots([])
      setAutoFindStep("patient")

      window.location.href = `/fliphtml?date=${date}`
    } catch (error: any) {
      alert(error.message || "Atama yapılırken bir hata oluştu")
    } finally {
      setIsSearchingSlots(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <Button onClick={() => setIsAddFormOpen(true)} className="w-full sm:w-auto">
          Bekleme Listesine Hasta Ekle
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            setAutoFindDialogOpen(true)
            setAutoFindStep("patient")
          }}
          disabled={surgeries.length === 0}
          className="gap-2 w-full sm:w-auto flex-wrap justify-center"
        >
          <Wand2 className="h-4 w-4" />
          Otomatik Bul
          <Badge
            variant="secondary"
            className="ml-1 bg-white text-red-600 hover:bg-white py-0 px-2 text-[10px] sm:text-xs"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            DENEYSEL
          </Badge>
        </Button>
      </div>

      {surgeries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Bekleme listesinde hasta yok</div>
      ) : (
        <div className="overflow-x-auto">
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
        </div>
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

      <Dialog
        open={autoFindDialogOpen}
        onOpenChange={(open) => {
          setAutoFindDialogOpen(open)
          if (!open) {
            setSelectedPatientForAutoFind(null)
            setAutoFindSalonId("")
            setAutoFindDoctorId("")
            setAvailableSlots([])
            setAutoFindStep("patient")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Otomatik Tarih Bul -{" "}
              {autoFindStep === "patient"
                ? "Hasta Seçimi"
                : autoFindStep === "salon"
                  ? "Salon Seçimi"
                  : autoFindStep === "doctor"
                    ? "Hoca Seçimi"
                    : "Uygun Tarihler"}
            </DialogTitle>
            <DialogDescription>
              {autoFindStep === "patient" && "Otomatik tarih bulunacak hastayı seçin"}
              {autoFindStep === "salon" && "Hastanız için ameliyat yapılacak salonu seçin"}
              {autoFindStep === "doctor" && "Ameliyatı yapacak hocayı seçin"}
              {autoFindStep === "results" && "Uygun tarihleri görüntüleyin ve seçin"}
            </DialogDescription>
          </DialogHeader>

          {autoFindStep === "patient" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="auto_patient">Hasta</Label>
                <Select value={selectedPatientForAutoFind || ""} onValueChange={setSelectedPatientForAutoFind}>
                  <SelectTrigger id="auto_patient">
                    <SelectValue placeholder="Hasta seçin">
                      {selectedPatientForAutoFind &&
                        surgeries.find((s) => s.id === selectedPatientForAutoFind)?.patient_name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {surgeries.map((surgery) => (
                      <SelectItem key={surgery.id} value={surgery.id}>
                        <div className="flex flex-col gap-0.5 py-1">
                          <span className="font-medium text-sm">{surgery.patient_name}</span>
                          <span className="text-xs text-gray-600">{surgery.procedure_name}</span>
                          <span className="text-xs text-gray-400">{surgery.protocol_number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPatientForAutoFind && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Seçili Hasta Bilgileri</h4>
                  {(() => {
                    const selectedPatient = surgeries.find((s) => s.id === selectedPatientForAutoFind)
                    if (!selectedPatient) return null
                    return (
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Hasta:</span> {selectedPatient.patient_name}
                        </div>
                        <div>
                          <span className="font-medium">Protokol No:</span> {selectedPatient.protocol_number}
                        </div>
                        <div>
                          <span className="font-medium">Yapılacak İşlem:</span> {selectedPatient.procedure_name}
                        </div>
                        {selectedPatient.responsible_doctor && (
                          <div>
                            <span className="font-medium">Sorumlu Hoca:</span> {selectedPatient.responsible_doctor.name}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {autoFindStep === "salon" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="auto_salon">Salon</Label>
                <Select value={autoFindSalonId} onValueChange={setAutoFindSalonId}>
                  <SelectTrigger id="auto_salon">
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
            </div>
          )}

          {autoFindStep === "doctor" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="auto_doctor">Hoca</Label>
                <Select value={autoFindDoctorId} onValueChange={setAutoFindDoctorId}>
                  <SelectTrigger id="auto_doctor">
                    <SelectValue placeholder="Hoca seçin" />
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
          )}

          {autoFindStep === "results" && (
            <AvailableSlotsDialog slots={availableSlots} onSelectSlot={handleSelectSlot} isLoading={isSearchingSlots} />
          )}

          <DialogFooter>
            {autoFindStep === "patient" && (
              <>
                <Button variant="outline" onClick={() => setAutoFindDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={() => setAutoFindStep("salon")} disabled={!selectedPatientForAutoFind}>
                  İleri
                </Button>
              </>
            )}

            {autoFindStep === "salon" && (
              <>
                <Button variant="outline" onClick={() => setAutoFindStep("patient")}>
                  Geri
                </Button>
                <Button onClick={() => setAutoFindStep("doctor")} disabled={!autoFindSalonId}>
                  İleri
                </Button>
              </>
            )}

            {autoFindStep === "doctor" && (
              <>
                <Button variant="outline" onClick={() => setAutoFindStep("salon")}>
                  Geri
                </Button>
                <Button onClick={handleAutoFind} disabled={isSearchingSlots || !autoFindDoctorId}>
                  {isSearchingSlots ? "Aranıyor..." : "Uygun Tarihleri Bul"}
                </Button>
              </>
            )}
          </DialogFooter>
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

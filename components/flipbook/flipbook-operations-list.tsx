"use client"

import { useState } from "react"
import type { SurgeryWithDetails, Doctor, Salon, ActivityLog } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { deleteSurgery, moveToWaitingList, approveSurgery, unapproveSurgery } from "@/lib/actions/surgeries"
import { createSurgeryNote } from "@/lib/actions/notes"
import { getSurgeryHistory } from "@/lib/actions/admin"
import { MoreHorizontal, Trash2, MessageSquare, ListX, Edit, Check, XIcon, History, Search, Phone } from "lucide-react"
import { SurgeryFormEdit } from "@/components/surgery-form-edit"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface FlipbookOperationsListProps {
  selectedDate: Date | null
  surgeries: SurgeryWithDetails[]
  doctors: Doctor[]
  salons: Salon[]
  onDataChange: () => void
  weekDays?: Date[]
  onDateChange?: (date: Date) => void
  selectedSalonId?: string // Added selectedSalonId prop for salon filtering
}

function formatActivityDetails(log: ActivityLog, salons: Salon[]): string {
  if (!log.details) return ""

  const details = log.details as any

  if (log.action === "Hasta Güncellendi" && details.changes) {
    const changes = details.changes
    const parts: string[] = []

    if (changes.patient_name !== undefined) {
      parts.push(`Hasta Adı Güncellendi`)
    }
    if (changes.protocol_number !== undefined) {
      parts.push(`Protokol Numarası Güncellendi`)
    }
    if (changes.indication !== undefined) {
      parts.push(`Endikasyon Güncellendi`)
    }
    if (changes.procedure_name !== undefined) {
      parts.push(`İşlem Adı Güncellendi`)
    }
    if (changes.phone_number_1 !== undefined) {
      parts.push(`Telefon 1 Güncellendi`)
    }
    if (changes.phone_number_2 !== undefined) {
      parts.push(`Telefon 2 Güncellendi`)
    }
    if (changes.responsible_doctor_id !== undefined) {
      parts.push(`Sorumlu Doktor Güncellendi`)
    }

    return parts.length > 0 ? parts.join(", ") : "Hasta bilgileri güncellendi"
  }

  // Handle different action types
  if (log.action === "Ameliyat Oluşturuldu" || log.action === "Ameliyat Güncellendi") {
    const parts: string[] = []

    if (details.salon_id) {
      const salon = salons.find((s) => s.id === details.salon_id)
      if (salon) {
        parts.push(`${salon.name}'e atandı`)
      }
    }

    if (details.surgery_date) {
      const date = new Date(details.surgery_date)
      parts.push(`Tarih: ${format(date, "d MMMM yyyy", { locale: tr })}`)
    }

    if (details.patient_name) {
      parts.push(`Hasta: ${details.patient_name}`)
    }

    if (details.protocol_number) {
      parts.push(`Protokol: ${details.protocol_number}`)
    }

    return parts.join(", ")
  }

  if (log.action === "Ameliyat Onaylandı") {
    return "Ameliyat onaylandı"
  }

  if (log.action === "Ameliyat Onayı Kaldırıldı") {
    return "Ameliyat onayı kaldırıldı"
  }

  if (log.action === "Bekleme Listesine Alındı") {
    return "Hasta bekleme listesine taşındı"
  }

  if (log.action === "Ameliyat Tarihi Değiştirildi") {
    if (details.old_date && details.new_date) {
      const oldDate = format(new Date(details.old_date), "d MMMM yyyy", { locale: tr })
      const newDate = format(new Date(details.new_date), "d MMMM yyyy", { locale: tr })
      return `Tarih değiştirildi: ${oldDate} → ${newDate}`
    }
  }

  // Fallback to showing some basic info
  if (details.salon_id) {
    const salon = salons.find((s) => s.id === details.salon_id)
    if (salon) return `${salon.name}`
  }

  return "Detay bilgisi mevcut değil"
}

export function FlipbookOperationsList({
  selectedDate,
  surgeries,
  doctors,
  salons,
  onDataChange,
  weekDays,
  onDateChange,
  selectedSalonId, // Accept selectedSalonId prop
}: FlipbookOperationsListProps) {
  const [selectedSurgery, setSelectedSurgery] = useState<string | null>(null)
  const [editingSurgery, setEditingSurgery] = useState<SurgeryWithDetails | null>(null)
  const [surgeryNote, setSurgeryNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; surgeryId: string | null; logs: ActivityLog[] }>({
    open: false,
    surgeryId: null,
    logs: [],
  })
  const [loadingHistory, setLoadingHistory] = useState(false)

  const daySurgeries = selectedDate
    ? surgeries.filter((s) => {
        if (!s.surgery_date) return false
        const surgeryDate = new Date(s.surgery_date)
        const dateMatch =
          surgeryDate.getFullYear() === selectedDate.getFullYear() &&
          surgeryDate.getMonth() === selectedDate.getMonth() &&
          surgeryDate.getDate() === selectedDate.getDate()

        // If salon is selected, filter by salon
        if (selectedSalonId) {
          return dateMatch && s.salon_id === selectedSalonId
        }

        return dateMatch
      })
    : []

  const filteredSurgeries = daySurgeries.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.patient_name.toLowerCase().includes(q) ||
      s.protocol_number.toLowerCase().includes(q) ||
      s.phone_number_1.includes(q) ||
      (s.phone_number_2 && s.phone_number_2.includes(q))
    )
  })

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

  const handleApprove = async (surgeryId: string, isApproved: boolean) => {
    try {
      if (isApproved) {
        await unapproveSurgery(surgeryId)
      } else {
        await approveSurgery(surgeryId)
      }
      onDataChange()
    } catch (error: any) {
      alert(error.message || "Onaylama işlemi sırasında bir hata oluştu")
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

  const handleShowHistory = async (surgeryId: string) => {
    setLoadingHistory(true)
    setHistoryDialog({ open: true, surgeryId, logs: [] })

    try {
      const logs = await getSurgeryHistory(surgeryId)
      setHistoryDialog({ open: true, surgeryId, logs })
    } catch (error: any) {
      alert(error.message || "Geçmiş yüklenirken bir hata oluştu")
      setHistoryDialog({ open: false, surgeryId: null, logs: [] })
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hasta ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {weekDays?.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd")
              const isSelected = dayStr === format(selectedDate, "yyyy-MM-dd")
              return (
                <Button
                  key={dayStr}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onDateChange?.(day)}
                  className="flex-shrink-0"
                >
                  {format(day, "d MMMM EEEE", { locale: tr })}
                </Button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent>
          {filteredSurgeries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery
                ? "Arama sonucu bulunamadı"
                : selectedDate
                  ? "Bu gün için ameliyat planlanmamış"
                  : "Gün seçiniz"}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-semibold">Sıra</th>
                      <th className="text-left p-2 text-sm font-semibold">Hasta Adı</th>
                      <th className="text-left p-2 text-sm font-semibold">Protokol</th>
                      <th className="text-left p-2 text-sm font-semibold">İşlem</th>
                      <th className="text-left p-2 text-sm font-semibold">Hoca</th>
                      <th className="text-left p-2 text-sm font-semibold">Telefon</th>
                      <th className="text-left p-2 text-sm font-semibold">Ekleyen</th>
                      <th className="text-left p-2 text-sm font-semibold">Onaylayan</th>
                      <th className="text-center p-2 text-sm font-semibold">Onay</th>
                      <th className="text-right p-2 text-sm font-semibold">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSurgeries.map((surgery, index) => (
                      <tr key={surgery.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-bold">{index + 1}</td>
                        <td className="p-2 font-medium">{surgery.patient_name}</td>
                        <td className="p-2 text-sm">{surgery.protocol_number}</td>
                        <td className="p-2 text-sm max-w-xs break-words">{surgery.procedure_name}</td>
                        <td className="p-2 text-sm">{surgery.responsible_doctor?.name || "-"}</td>
                        <td className="p-2 text-xs">
                          <div className="space-y-1">
                            {surgery.phone_number_1 && (
                              <a
                                href={`tel:${surgery.phone_number_1}`}
                                className="flex items-center gap-1 hover:text-blue-600"
                              >
                                <Phone className="h-3 w-3" />
                                {surgery.phone_number_1}
                              </a>
                            )}
                            {surgery.phone_number_2 && (
                              <a
                                href={`tel:${surgery.phone_number_2}`}
                                className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                              >
                                <Phone className="h-3 w-3" />
                                {surgery.phone_number_2}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          {surgery.creator ? `${surgery.creator.first_name} ${surgery.creator.last_name}` : "-"}
                        </td>
                        <td className="p-2 text-sm">
                          {surgery.approver ? `${surgery.approver.first_name} ${surgery.approver.last_name}` : "-"}
                        </td>
                        <td className="p-2 text-center">
                          {surgery.is_approved && <Check className="h-4 w-4 text-green-600 mx-auto" />}
                        </td>
                        <td className="p-2 text-right">
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
                              <DropdownMenuItem onClick={() => handleApprove(surgery.id, surgery.is_approved)}>
                                {surgery.is_approved ? (
                                  <>
                                    <XIcon className="h-4 w-4 mr-2" />
                                    Onayı Kaldır
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Onayla
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShowHistory(surgery.id)}>
                                <History className="h-4 w-4 mr-2" />
                                Değişiklik Geçmişi
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {filteredSurgeries.map((surgery, index) => (
                  <Card key={surgery.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{surgery.patient_name}</div>
                            <div className="text-xs text-muted-foreground">{surgery.protocol_number}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {surgery.is_approved && <Check className="h-5 w-5 text-green-600" />}
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
                              <DropdownMenuItem onClick={() => handleApprove(surgery.id, surgery.is_approved)}>
                                {surgery.is_approved ? (
                                  <>
                                    <XIcon className="h-4 w-4 mr-2" />
                                    Onayı Kaldır
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Onayla
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShowHistory(surgery.id)}>
                                <History className="h-4 w-4 mr-2" />
                                Değişiklik Geçmişi
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
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="font-medium text-gray-700">İşlem:</div>
                        <div className="text-gray-600">{surgery.procedure_name}</div>
                      </div>

                      {surgery.responsible_doctor && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Hoca: </span>
                          <span className="text-gray-600">{surgery.responsible_doctor.name}</span>
                        </div>
                      )}

                      <div className="space-y-1 text-sm">
                        {surgery.phone_number_1 && (
                          <a
                            href={`tel:${surgery.phone_number_1}`}
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {surgery.phone_number_1}
                          </a>
                        )}
                        {surgery.phone_number_2 && (
                          <a
                            href={`tel:${surgery.phone_number_2}`}
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {surgery.phone_number_2}
                          </a>
                        )}
                      </div>

                      <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
                        <div>
                          <div className="font-medium">Ekleyen:</div>
                          <div>
                            {surgery.creator ? `${surgery.creator.first_name} ${surgery.creator.last_name}` : "-"}
                          </div>
                        </div>
                        {surgery.approver && (
                          <div>
                            <div className="font-medium">Onaylayan:</div>
                            <div>
                              {surgery.approver.first_name} {surgery.approver.last_name}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
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

      <Dialog
        open={historyDialog.open}
        onOpenChange={(open) => !open && setHistoryDialog({ open: false, surgeryId: null, logs: [] })}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hasta Değişiklik Geçmişi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : historyDialog.logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Henüz değişiklik kaydı yok</div>
            ) : (
              <div className="space-y-3">
                {historyDialog.logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{log.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: tr })}
                      </div>
                    </div>
                    {log.user && (
                      <div className="text-sm text-muted-foreground">
                        {log.user.first_name} {log.user.last_name}
                      </div>
                    )}
                    {log.details && (
                      <div className="text-sm bg-slate-50 p-2 rounded">{formatActivityDetails(log, salons)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

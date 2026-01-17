"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
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
import { assignFromWaitingList, deleteSurgery, assignToCalendar } from "@/lib/actions/surgeries"
import { Calendar, MoreHorizontal, Trash2, MessageSquare, ArrowUpDown, Clock, Edit } from "lucide-react"
import { SurgeryForm } from "@/components/surgery-form"
import { Textarea } from "@/components/ui/textarea"
import { createSurgeryNote } from "@/lib/actions/notes"
import { findAvailableDates } from "@/lib/actions/auto-scheduler"
import { AvailableSlotsDialog } from "@/components/waiting-list/available-slots-dialog"
import { Badge } from "@/components/ui/badge"
import { DoctorFilter } from "@/components/doctor-filter"
import { Search, X, User } from "lucide-react"
import { PatientSearch } from "@/components/patient-search"
import { SurgeryFormEdit } from "@/components/surgery-form-edit"

interface WaitingListTableProps {
  initialSurgeries: SurgeryWithDetails[]
  doctors: Doctor[]
  salons: Salon[]
}

type SortColumn = "patient_name" | "protocol_number" | "procedure_name" | "doctor" | "created_at"
type SortDirection = "asc" | "desc" | null

const getMinDate = () => {
  const today = new Date()
  const day = today.getDay()
  if (day === 6) today.setDate(today.getDate() + 2)
  if (day === 0) today.setDate(today.getDate() + 1)
  return today.toISOString().split("T")[0]
}

const isWeekend = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00")
  const day = date.getDay()
  return day === 0 || day === 6
}

export function WaitingListTable({ initialSurgeries, doctors, salons }: WaitingListTableProps) {
  const [surgeries, setSurgeries] = useState<SurgeryWithDetails[]>(initialSurgeries)
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
  const [autoFindSurgeryId, setAutoFindSurgeryId] = useState<string | null>(null)
  const [autoFindDoctorId, setAutoFindDoctorId] = useState("")
  const [autoFindSalonId, setAutoFindSalonId] = useState("")
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [showAutoFindStep, setShowAutoFindStep] = useState<"select" | "slots">("select")
  const [isFetchingSalons, setIsFetchingSalons] = useState(false)
  const [dynamicSalons, setDynamicSalons] = useState<Salon[]>(salons)
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [editingSurgery, setEditingSurgery] = useState<SurgeryWithDetails | null>(null)

  const router = useRouter()

  const handleAssign = async () => {
    if (!selectedSurgery || !assignSalonId || !assignDate) return

    if (isWeekend(assignDate)) {
      toast({
        title: "Hata",
        description: "Cumartesi ve Pazar günleri ameliyat yapılamaz",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    try {
      await assignFromWaitingList(selectedSurgery, assignSalonId, assignDate)
      setSelectedSurgery(null)
      setAssignSalonId("")
      setAssignDate("")
      router.push("/fliphtml")
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Atama yapılırken bir hata oluştu",
        variant: "destructive",
      })
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
      toast({
        title: "Hata",
        description: error.message || "Hasta silinirken bir hata oluştu",
        variant: "destructive",
      })
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
      toast({
        title: "Hata",
        description: error.message || "Not eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleAutoFind = async () => {
    if (!autoFindDoctorId || !autoFindSalonId || !autoFindSurgeryId) return

    setIsLoadingSlots(true)
    try {
      const result = await findAvailableDates(autoFindSalonId, autoFindDoctorId, autoFindSurgeryId)

      if (result.success && result.slots) {
        setAvailableSlots(result.slots)
        setShowAutoFindStep("slots")
      } else {
        toast({
          title: "Uygun tarih bulunamadı",
          description: result.error || "Seçilen hoca için önümüzdeki 3 ayda uygun tarih bulunamadı.",
          variant: "destructive",
        })
        setAutoFindSurgeryId(null)
        setAutoFindDoctorId("")
        setAutoFindSalonId("")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tarih arama işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleSelectAutoFindSlot = async (date: string) => {
    if (!autoFindSurgeryId) return

    try {
      await assignToCalendar(autoFindSurgeryId, autoFindSalonId, date)

      toast({
        title: "Başarılı",
        description: "Hasta takvime atandı. Yönlendiriliyorsunuz...",
      })

      // Use Next.js router for proper client-side navigation
      router.push(`/fliphtml?salon=${autoFindSalonId}&date=${date}`)
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Hasta atanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handlePatientSelect = (surgeryId: string) => {
    const element = document.getElementById(`surgery-${surgeryId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.classList.add("bg-yellow-100", "dark:bg-yellow-900/20")
      setTimeout(() => {
        element.classList.remove("bg-yellow-100", "dark:bg-yellow-900/20")
      }, 2000)
    }
  }

  const fetchData = async () => {
    // Fetch updated surgeries data here
    const response = await fetch("/api/surgeries?is_waiting_list=true")
    if (response.ok) {
      const data = await response.json()
      setSurgeries(data)
    }
  }

  const safeSurgeries = Array.isArray(surgeries) ? surgeries : []

  const filteredSurgeries =
    selectedDoctors.length > 0
      ? safeSurgeries.filter((s) => s.responsible_doctor_id && selectedDoctors.includes(s.responsible_doctor_id))
      : safeSurgeries

  const sortedSurgeries = [...filteredSurgeries].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0

    let compareResult = 0

    switch (sortColumn) {
      case "patient_name":
        compareResult = a.patient_name.localeCompare(b.patient_name, "tr-TR")
        break
      case "protocol_number":
        compareResult = a.protocol_number.localeCompare(b.protocol_number)
        break
      case "procedure_name":
        compareResult = a.procedure_name.localeCompare(b.procedure_name, "tr-TR")
        break
      case "doctor":
        const doctorA = a.responsible_doctor?.name || ""
        const doctorB = b.responsible_doctor?.name || ""
        compareResult = doctorA.localeCompare(doctorB, "tr-TR")
        break
      case "created_at":
        compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
    }

    return sortDirection === "asc" ? compareResult : -compareResult
  })

  const filteredAndSortedSurgeries = sortedSurgeries

  useEffect(() => {
    const fetchSalons = async () => {
      if (selectedSurgery && !isFetchingSalons) {
        setIsFetchingSalons(true)
        try {
          const response = await fetch("/api/salons")
          if (response.ok) {
            const data = await response.json()
            setDynamicSalons(data)
          }
        } catch (error) {
          console.error("Error fetching salons:", error)
        } finally {
          setIsFetchingSalons(false)
        }
      }
    }

    fetchSalons()
  }, [selectedSurgery])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Bekleme Listesi</h2>
          <Badge variant="secondary" className="text-sm">
            {filteredAndSortedSurgeries.length} Hasta
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <PatientSearch onSelectPatient={handlePatientSelect} isWaitingListOnly={true} />
          <DoctorFilter
            doctors={doctors}
            selectedDoctors={selectedDoctors}
            onSelectionChange={setSelectedDoctors}
            multiSelect={true}
          />
          <Button onClick={() => setIsAddFormOpen(true)} size="sm">
            Hasta Ekle
          </Button>
        </div>
      </div>

      {filteredSurgeries.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          {selectedDoctors.length > 0
            ? "Seçili hocalara ait bekleme listesinde hasta yok"
            : "Bekleme listesinde hasta yok"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="dark:text-slate-100 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("patient_name")}
                >
                  <div className="flex items-center gap-1">
                    Hasta Adı
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="dark:text-slate-100 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("protocol_number")}
                >
                  <div className="flex items-center gap-1">
                    Protokol No
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="dark:text-slate-100 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("procedure_name")}
                >
                  <div className="flex items-center gap-1">
                    Yapılacak İşlem
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="dark:text-slate-100 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("doctor")}
                >
                  <div className="flex items-center gap-1">
                    Sorumlu Hoca
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-100">Telefon</TableHead>
                <TableHead className="dark:text-slate-100">Ekleyen</TableHead>
                <TableHead
                  className="dark:text-slate-100 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-1">
                    Eklenme Tarihi
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right dark:text-slate-100">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSurgeries.map((surgery) => (
                <TableRow key={surgery.id} id={`surgery-${surgery.id}`}>
                  <TableCell className="font-medium dark:text-slate-100">{surgery.patient_name}</TableCell>
                  <TableCell className="dark:text-slate-100">{surgery.protocol_number}</TableCell>
                  <TableCell className="max-w-xs dark:text-slate-100">{surgery.procedure_name}</TableCell>
                  <TableCell className="dark:text-slate-100">{surgery.responsible_doctor?.name || "-"}</TableCell>
                  <TableCell className="text-sm dark:text-slate-100">
                    <div>{surgery.phone_number_1}</div>
                    <div className="text-gray-500 dark:text-slate-400">{surgery.phone_number_2}</div>
                  </TableCell>
                  <TableCell className="text-sm dark:text-slate-100">
                    {surgery.creator ? (
                      <div>
                        {surgery.creator.first_name} {surgery.creator.last_name}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm dark:text-slate-100">
                    {new Date(surgery.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="dark:bg-slate-700 dark:border-slate-600">
                        <DropdownMenuItem onClick={() => setEditingSurgery(surgery)} className="dark:text-slate-100">
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAutoFindSurgeryId(surgery.id)}
                          className="dark:text-slate-100"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Otomatik Bul
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedSurgery(surgery.id)}
                          className="dark:text-slate-100"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Takvime Ata
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSurgeryForNote(surgery.id)
                            setNoteDialogOpen(true)
                          }}
                          className="dark:text-slate-100"
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
              <Select value={assignSalonId} onValueChange={setAssignSalonId} disabled={isFetchingSalons}>
                <SelectTrigger id="assign_salon">
                  <SelectValue placeholder={isFetchingSalons ? "Salonlar yükleniyor..." : "Salon seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {dynamicSalons.map((salon) => (
                    <SelectItem key={salon.id} value={salon.id}>
                      {salon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign_date">Ameliyat Tarihi</Label>
              <Input
                id="assign_date"
                type="date"
                value={assignDate}
                onChange={(e) => {
                  setAssignDate(e.target.value)
                  if (e.target.value && isWeekend(e.target.value)) {
                    toast({
                      title: "Hata",
                      description: "Cumartesi ve Pazar günleri seçilemez",
                      variant: "destructive",
                    })
                  }
                }}
                min={getMinDate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSurgery(null)} disabled={isAssigning}>
              İptal
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning || !assignSalonId || !assignDate || isFetchingSalons}>
              {isAssigning ? "Atanıyor..." : "Ata"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!autoFindSurgeryId}
        onOpenChange={() => {
          setAutoFindSurgeryId(null)
          setAutoFindDoctorId("")
          setAutoFindSalonId("")
          setAvailableSlots([])
          setShowAutoFindStep("select")
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Otomatik Tarih Bul</DialogTitle>
            <DialogDescription>
              {showAutoFindStep === "select"
                ? "Hastanın sorumlu hocasını ve salonu seçin, sistem uygun tarihleri bulacaktır."
                : "Uygun tarihlerden birini seçerek hastayı atayın."}
            </DialogDescription>
          </DialogHeader>

          {showAutoFindStep === "select" ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="auto_find_doctor">Sorumlu Hoca</Label>
                <Select value={autoFindDoctorId} onValueChange={setAutoFindDoctorId}>
                  <SelectTrigger id="auto_find_doctor">
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
              <div className="space-y-2">
                <Label htmlFor="auto_find_salon">Salon</Label>
                <Select value={autoFindSalonId} onValueChange={setAutoFindSalonId} disabled={isFetchingSalons}>
                  <SelectTrigger id="auto_find_salon">
                    <SelectValue placeholder={isFetchingSalons ? "Salonlar yükleniyor..." : "Salon seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicSalons.map((salon) => (
                      <SelectItem key={salon.id} value={salon.id}>
                        {salon.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAutoFindSurgeryId(null)
                    setAutoFindDoctorId("")
                    setAutoFindSalonId("")
                  }}
                  disabled={isLoadingSlots}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleAutoFind}
                  disabled={isLoadingSlots || !autoFindDoctorId || !autoFindSalonId || isFetchingSalons}
                >
                  {isLoadingSlots ? "Aranıyor..." : "Uygun Tarihleri Bul"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <AvailableSlotsDialog
              slots={availableSlots}
              onSelectSlot={handleSelectAutoFindSlot}
              isLoading={isLoadingSlots}
            />
          )}
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

      {editingSurgery && (
        <SurgeryFormEdit
          surgery={editingSurgery}
          doctors={doctors}
          open={!!editingSurgery}
          onOpenChange={(open) => !open && setEditingSurgery(null)}
          onSuccess={() => {
            fetchData()
            toast({
              title: "Başarılı",
              description: "Hasta bilgileri güncellendi",
            })
          }}
        />
      )}

      <SurgeryForm
        open={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        doctors={doctors}
        salons={salons}
        isWaitingList={true}
      />
    </div>
  )
}

function WaitingListPatientSearch({
  onSelectPatient,
  surgeries,
}: {
  onSelectPatient: (patientId: string) => void
  surgeries: SurgeryWithDetails[]
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SurgeryWithDetails[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const searchWaitingListPatients = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setIsOpen(false)
        return
      }

      setIsSearching(true)
      setIsOpen(true)

      // Filter locally from waiting list surgeries
      const query = searchQuery.toLowerCase()
      const filtered = surgeries.filter(
        (s) =>
          s.patient_name.toLowerCase().includes(query) ||
          s.protocol_number?.toLowerCase().includes(query) ||
          s.indication?.toLowerCase().includes(query) ||
          s.procedure_name?.toLowerCase().includes(query),
      )

      setSearchResults(filtered.slice(0, 10))
      setIsSearching(false)
    }

    const debounceTimer = setTimeout(searchWaitingListPatients, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, surgeries])

  const handleSelectPatient = (surgery: SurgeryWithDetails) => {
    onSelectPatient(surgery.id)
    setSearchQuery("")
    setSearchResults([])
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Hasta adı, protokol, işlem ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => {
              setSearchQuery("")
              setSearchResults([])
              setIsOpen(false)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full mt-1 bg-white rounded-lg shadow-xl border z-50 max-h-[300px] overflow-y-auto w-full">
          {searchResults.map((surgery) => (
            <button
              key={surgery.id}
              className="w-full p-3 text-left hover:bg-slate-50 border-b last:border-b-0 transition-colors"
              onClick={() => handleSelectPatient(surgery)}
            >
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{surgery.patient_name}</p>
                  {surgery.protocol_number && (
                    <p className="text-xs text-slate-500">Protokol: {surgery.protocol_number}</p>
                  )}
                  {surgery.indication && <p className="text-xs text-slate-600 truncate">{surgery.indication}</p>}
                  {surgery.procedure_name && (
                    <p className="text-xs text-purple-600 truncate font-medium">{surgery.procedure_name}</p>
                  )}
                  {surgery.responsible_doctor && (
                    <p className="text-xs text-orange-600 truncate">{surgery.responsible_doctor.name}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="absolute top-full mt-1 bg-white rounded-lg shadow-xl border z-50 p-4 text-center text-slate-500 text-sm w-full">
          Hasta bulunamadı
        </div>
      )}

      {isSearching && (
        <div className="absolute top-full mt-1 bg-white rounded-lg shadow-xl border z-50 p-4 text-center text-slate-500 text-sm w-full">
          Aranıyor...
        </div>
      )}
    </div>
  )
}

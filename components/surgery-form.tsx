"use client"

import type React from "react"
import type { Doctor, Salon, Surgery } from "@/lib/types"
import { createSurgery, updateSurgery } from "@/lib/actions/surgeries"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Wand2, AlertCircle } from "lucide-react"
import { findAvailableDates } from "@/lib/actions/auto-scheduler"
import { AvailableSlotsDialog } from "@/components/waiting-list/available-slots-dialog"
import { useRouter } from "next/navigation"

interface SurgeryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctors: Doctor[]
  salons: Salon[]
  defaultDate?: string
  defaultSalonId?: string
  isWaitingList?: boolean
  surgery?: Surgery | null // Added surgery prop for edit mode
}

const getMinDate = () => {
  const today = new Date()
  const day = today.getDay()
  // If today is Saturday (6), start from Monday
  if (day === 6) {
    today.setDate(today.getDate() + 2)
  }
  // If today is Sunday (0), start from Monday
  if (day === 0) {
    today.setDate(today.getDate() + 1)
  }
  return today.toISOString().split("T")[0]
}

const isWeekend = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00")
  const day = date.getDay()
  return day === 0 || day === 6
}

export function SurgeryForm({
  open,
  onOpenChange,
  doctors,
  salons,
  defaultDate,
  defaultSalonId,
  isWaitingList = false,
  surgery, // Added surgery parameter
}: SurgeryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignmentType, setAssignmentType] = useState<"salon" | "waiting" | "auto">(
    isWaitingList ? "waiting" : surgery ? (surgery.salon_id ? "salon" : "waiting") : "salon",
  )

  const [autoFindOpen, setAutoFindOpen] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [isSearchingSlots, setIsSearchingSlots] = useState(false)
  const [pendingPatientData, setPendingPatientData] = useState<any>(null)
  const [surgeryDateError, setSurgeryDateError] = useState<string | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (assignmentType === "salon") {
      const formData = new FormData(e.currentTarget)
      const selectedDate = formData.get("surgery_date") as string
      if (selectedDate && isWeekend(selectedDate)) {
        setError("Cumartesi ve Pazar günleri ameliyat yapılamaz")
        return
      }
    }

    if (surgery) {
      setIsLoading(true)
      setError(null)

      try {
        const updatedData = {
          patient_name: e.currentTarget.patient_name.value as string,
          protocol_number: e.currentTarget.protocol_number.value as string,
          indication: e.currentTarget.indication.value as string,
          procedure_name: e.currentTarget.procedure_name.value as string,
          responsible_doctor_id: (e.currentTarget.responsible_doctor_id.value as string) || null,
          phone_number_1: e.currentTarget.phone_number_1.value as string,
          phone_number_2: e.currentTarget.phone_number_2.value as string,
          salon_id: assignmentType === "waiting" ? null : (e.currentTarget.salon_id.value as string) || null,
          surgery_date: assignmentType === "waiting" ? "" : (e.currentTarget.surgery_date.value as string),
          is_waiting_list: assignmentType === "waiting",
        }

        // Validate weekend
        if (assignmentType === "salon" && updatedData.surgery_date && isWeekend(updatedData.surgery_date)) {
          setError("Cumartesi ve Pazar günleri ameliyat yapılamaz")
          setIsLoading(false)
          return
        }

        console.log("[v0] Updating surgery:", surgery.id, updatedData)
        await updateSurgery(surgery.id, updatedData)

        onOpenChange(false)
        window.dispatchEvent(new Event("calendarDataChanged"))
        window.dispatchEvent(new Event("waitingListChanged"))
        alert("Hasta bilgileri güncellendi!")
      } catch (err: any) {
        console.error("[v0] Error updating surgery:", err)
        setError(err.message || "Hasta güncellenirken bir hata oluştu")
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    if (assignmentType === "auto") {
      const patientData = {
        patient_name: formData.get("patient_name") as string,
        protocol_number: formData.get("protocol_number") as string,
        indication: formData.get("indication") as string,
        procedure_name: formData.get("procedure_name") as string,
        responsible_doctor_id: (formData.get("responsible_doctor_id") as string) || null,
        phone_number_1: formData.get("phone_number_1") as string,
        phone_number_2: formData.get("phone_number_2") as string,
        salon_id: formData.get("salon_id") as string,
      }

      if (!patientData.patient_name || !patientData.protocol_number) {
        setError("Lütfen hasta adı ve protokol numarasını girin")
        setIsLoading(false)
        return
      }

      if (!patientData.salon_id || !patientData.responsible_doctor_id) {
        setError("Lütfen salon ve sorumlu hoca seçin")
        setIsLoading(false)
        return
      }

      setPendingPatientData(patientData)

      try {
        console.log("[v0] Searching for available slots with data:", patientData)

        const result = await findAvailableDates(patientData.salon_id, patientData.responsible_doctor_id, null)

        console.log("[v0] Auto-find result:", result)

        if (result.success && result.slots && result.slots.length > 0) {
          setAvailableSlots(result.slots)
          setAutoFindOpen(true)
          setIsLoading(false)
        } else {
          console.log("[v0] No slots found, adding to waiting list")

          await createSurgery({
            ...patientData,
            is_waiting_list: true,
            salon_id: null,
            surgery_date: "",
          })

          alert(
            "Uygun tarih bulunamadı. Hasta bekleme listesine eklendi. İlerleyen tarihlerde uygun yer açıldığında hasta atanabilir.",
          )
          onOpenChange(false)
          ;(e.target as HTMLFormElement).reset()
          setPendingPatientData(null)
          window.dispatchEvent(new Event("waitingListChanged"))
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error("[v0] Error in auto-find:", err)
        setError(err.message || "Otomatik yer bulma sırasında bir hata oluştu")
        setIsLoading(false)
      }
      return
    }

    if (assignmentType === "salon" && !formData.get("salon_id")) {
      setError("Lütfen bir salon seçin veya bekleme listesine ekleyin")
      setIsLoading(false)
      return
    }

    try {
      const surgeryData = {
        patient_name: formData.get("patient_name") as string,
        protocol_number: formData.get("protocol_number") as string,
        indication: formData.get("indication") as string,
        procedure_name: formData.get("procedure_name") as string,
        responsible_doctor_id: (formData.get("responsible_doctor_id") as string) || null,
        phone_number_1: formData.get("phone_number_1") as string,
        phone_number_2: formData.get("phone_number_2") as string,
        salon_id: assignmentType === "waiting" ? null : (formData.get("salon_id") as string) || null,
        surgery_date: assignmentType === "waiting" ? "" : (formData.get("surgery_date") as string),
        is_waiting_list: assignmentType === "waiting",
      }

      console.log("[v0] Creating surgery with data:", surgeryData)
      const result = await createSurgery(surgeryData)
      console.log("[v0] Surgery created successfully:", result)

      onOpenChange(false)
      ;(e.target as HTMLFormElement).reset()
      setAssignmentType(isWaitingList ? "waiting" : "salon")

      window.dispatchEvent(new Event("calendarDataChanged"))
      window.dispatchEvent(new Event("waitingListChanged"))

      alert(assignmentType === "waiting" ? "Hasta bekleme listesine eklendi!" : "Hasta salona eklendi!")
    } catch (err: any) {
      console.error("[v0] Error creating surgery:", err)
      setError(err.message || "Ameliyat eklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAutoSlot = async (date: string) => {
    if (!pendingPatientData) return

    setIsSearchingSlots(true)
    try {
      console.log("[v0] Creating and assigning patient to date:", date)

      const result = await createSurgery({
        ...pendingPatientData,
        salon_id: pendingPatientData.salon_id,
        surgery_date: date,
        is_waiting_list: false,
      })

      console.log("[v0] Patient created and assigned successfully")

      setAutoFindOpen(false)
      onOpenChange(false)
      setPendingPatientData(null)
      setAvailableSlots([])

      window.dispatchEvent(new Event("calendarDataChanged"))
      window.dispatchEvent(new Event("waitingListChanged"))

      sessionStorage.setItem(
        "flipbook_scroll_target",
        JSON.stringify({
          date: date,
          salonId: pendingPatientData.salon_id,
        }),
      )

      setTimeout(() => {
        console.log("[v0] Redirecting to fliphtml with scroll target:", date)
        window.location.href = "/fliphtml"
      }, 100)
    } catch (error: any) {
      console.error("[v0] Error assigning slot:", error)
      alert(error.message || "Atama yapılırken bir hata oluştu")
    } finally {
      setIsSearchingSlots(false)
    }
  }

  const handleBackFromSlots = () => {
    console.log("[v0] Back button clicked - returning to form without saving")
    setAutoFindOpen(false)
    setAvailableSlots([])
    setIsLoading(false)
    setIsSearchingSlots(false)
    // Keep pendingPatientData so user can see their form data
  }

  const handleMainDialogClose = (open: boolean) => {
    if (!open) {
      setPendingPatientData(null)
      setAvailableSlots([])
      setAutoFindOpen(false)
      setError(null)
      setAssignmentType(isWaitingList ? "waiting" : surgery ? (surgery.salon_id ? "salon" : "waiting") : "salon")
    }
    onOpenChange(open)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleMainDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} id="surgery-form">
            <DialogHeader>
              <DialogTitle>{surgery ? "Hasta Bilgilerini Düzenle" : "Yeni Hasta Ekle"}</DialogTitle>
              <DialogDescription>
                {surgery
                  ? "Hasta bilgilerini düzenleyin"
                  : "Hastayı salona atayın, otomatik yer bulun veya bekleme listesine ekleyin"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!surgery && (
                <div className="space-y-3">
                  <Label>Hasta Durumu</Label>
                  <RadioGroup value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="salon" id="salon" />
                      <Label htmlFor="salon" className="font-normal cursor-pointer">
                        Salona Ata
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="auto" id="auto" />
                      <Label htmlFor="auto" className="font-normal cursor-pointer flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        Otomatik Yer Bul
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          <AlertCircle className="h-3 w-3 mr-0.5" />
                          DENEYSEL
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="waiting" id="waiting" />
                      <Label htmlFor="waiting" className="font-normal cursor-pointer">
                        Bekleme Listesine Ekle
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="patient_name">Hasta Adı</Label>
                  <Input
                    id="patient_name"
                    name="patient_name"
                    required
                    disabled={isLoading}
                    defaultValue={surgery?.patient_name || pendingPatientData?.patient_name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protocol_number">Protokol Numarası</Label>
                  <Input
                    id="protocol_number"
                    name="protocol_number"
                    required
                    disabled={isLoading}
                    defaultValue={surgery?.protocol_number || pendingPatientData?.protocol_number || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indication">Endikasyon</Label>
                  <Input
                    id="indication"
                    name="indication"
                    required
                    disabled={isLoading}
                    defaultValue={surgery?.indication || pendingPatientData?.indication || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure_name">Yapılacak İşlem</Label>
                <Textarea
                  id="procedure_name"
                  name="procedure_name"
                  required
                  disabled={isLoading}
                  rows={3}
                  defaultValue={surgery?.procedure_name || pendingPatientData?.procedure_name || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible_doctor_id">
                  Sorumlu Hoca {assignmentType === "auto" && <span className="text-red-600">*</span>}
                </Label>
                <Select
                  name="responsible_doctor_id"
                  disabled={isLoading}
                  required={assignmentType === "auto"}
                  defaultValue={
                    surgery?.responsible_doctor_id || pendingPatientData?.responsible_doctor_id || undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number_1">Telefon 1</Label>
                  <Input
                    id="phone_number_1"
                    name="phone_number_1"
                    type="tel"
                    required
                    disabled={isLoading}
                    defaultValue={surgery?.phone_number_1 || pendingPatientData?.phone_number_1 || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number_2">Telefon 2</Label>
                  <Input
                    id="phone_number_2"
                    name="phone_number_2"
                    type="tel"
                    required
                    disabled={isLoading}
                    defaultValue={surgery?.phone_number_2 || pendingPatientData?.phone_number_2 || ""}
                  />
                </div>
              </div>

              {(assignmentType === "salon" || assignmentType === "auto" || surgery) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salon_id">
                      Salon {assignmentType === "auto" && <span className="text-red-600">*</span>}
                    </Label>
                    <Select
                      name="salon_id"
                      defaultValue={surgery?.salon_id || pendingPatientData?.salon_id || defaultSalonId}
                      disabled={isLoading}
                      required={assignmentType === "auto"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
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
                  {(assignmentType === "salon" || surgery) && (
                    <div className="space-y-2">
                      <Label htmlFor="surgery_date">Ameliyat Tarihi *</Label>
                      <Input
                        id="surgery_date"
                        name="surgery_date"
                        type="date"
                        defaultValue={surgery?.surgery_date || defaultDate}
                        disabled={isLoading}
                        min={getMinDate()}
                        onChange={(e) => {
                          if (e.target.value && isWeekend(e.target.value)) {
                            setSurgeryDateError("Cumartesi ve Pazar günleri seçilemez")
                            e.target.setCustomValidity("Cumartesi ve Pazar günleri seçilemez")
                          } else {
                            setSurgeryDateError(null)
                            e.target.setCustomValidity("")
                          }
                        }}
                      />
                      {surgeryDateError && <p className="text-xs text-red-600">{surgeryDateError}</p>}
                    </div>
                  )}
                </div>
              )}

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleMainDialogClose(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading
                  ? "İşleniyor..."
                  : surgery
                    ? "Güncelle"
                    : assignmentType === "waiting"
                      ? "Bekleme Listesine Ekle"
                      : assignmentType === "auto"
                        ? "Otomatik Yer Bul"
                        : "Salona Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={autoFindOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleBackFromSlots()
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uygun Tarihler</DialogTitle>
            <DialogDescription>Aşağıdaki tarihlerden birini seçerek hastayı atayabilirsiniz</DialogDescription>
          </DialogHeader>

          <AvailableSlotsDialog
            slots={availableSlots}
            onSelectSlot={handleSelectAutoSlot}
            isLoading={isSearchingSlots}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleBackFromSlots} disabled={isSearchingSlots}>
              Formu Düzenle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

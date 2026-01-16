"use client"

import type React from "react"
import type { Doctor, Salon, Surgery } from "@/lib/types"
import { createSurgery, updateSurgery } from "@/lib/actions/surgeries"
import { useState, useEffect, useCallback } from "react"
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
import { Wand2, AlertCircle, Loader2 } from "lucide-react"
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
  surgery?: Surgery | null
}

const getMinDate = () => {
  const today = new Date()
  const day = today.getDay()
  if (day === 6) {
    today.setDate(today.getDate() + 2)
  }
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
  doctors: propDoctors,
  salons: propSalons,
  defaultDate,
  defaultSalonId,
  isWaitingList = false,
  surgery,
}: SurgeryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignmentType, setAssignmentType] = useState<"salon" | "waiting" | "auto">(
    isWaitingList ? "waiting" : surgery ? (surgery.salon_id ? "salon" : "waiting") : "salon",
  )

  const [salons, setSalons] = useState<Salon[]>(propSalons || [])
  const [doctors, setDoctors] = useState<Doctor[]>(propDoctors || [])
  const [isLoadingData, setIsLoadingData] = useState(false)

  const [autoFindOpen, setAutoFindOpen] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [isSearchingSlots, setIsSearchingSlots] = useState(false)
  const [pendingPatientData, setPendingPatientData] = useState<any>(null)
  const [surgeryDateError, setSurgeryDateError] = useState<string | null>(null)

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    surgery?.responsible_doctor_id || pendingPatientData?.responsible_doctor_id || null,
  )
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(
    surgery?.salon_id || pendingPatientData?.salon_id || defaultSalonId || null,
  )
  const [assignedDates, setAssignedDates] = useState<Set<string>>(new Set())
  const [isLoadingDates, setIsLoadingDates] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return

      const needsSalons = !propSalons || propSalons.length === 0
      const needsDoctors = !propDoctors || propDoctors.length === 0

      if (!needsSalons && !needsDoctors) {
        setSalons(propSalons)
        setDoctors(propDoctors)
        return
      }

      setIsLoadingData(true)
      try {
        const promises: Promise<any>[] = []

        if (needsSalons) {
          promises.push(
            fetch("/api/salons")
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => []),
          )
        } else {
          promises.push(Promise.resolve(propSalons))
        }

        if (needsDoctors) {
          promises.push(
            fetch("/api/doctors")
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => []),
          )
        } else {
          promises.push(Promise.resolve(propDoctors))
        }

        const [salonsData, doctorsData] = await Promise.all(promises)
        setSalons(salonsData || [])
        setDoctors(doctorsData || [])
      } catch (err) {
        console.error("Error fetching form data:", err)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [open, propSalons, propDoctors])

  // Update local state when props change
  useEffect(() => {
    if (propSalons && propSalons.length > 0) {
      setSalons(propSalons)
    }
    if (propDoctors && propDoctors.length > 0) {
      setDoctors(propDoctors)
    }
  }, [propSalons, propDoctors])

  const fetchAssignedDates = useCallback(async () => {
    if (!selectedDoctorId || !selectedSalonId || (assignmentType !== "salon" && !surgery)) {
      setAssignedDates(new Set())
      return
    }

    setIsLoadingDates(true)
    try {
      const response = await fetch(`/api/doctor-assigned-dates?doctorId=${selectedDoctorId}&salonId=${selectedSalonId}`)

      if (!response.ok) {
        setAssignedDates(new Set())
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        setAssignedDates(new Set())
        return
      }

      const data = await response.json()
      if (data.success && data.dates) {
        setAssignedDates(new Set(data.dates))
      } else {
        setAssignedDates(new Set())
      }
    } catch (err) {
      setAssignedDates(new Set())
    } finally {
      setIsLoadingDates(false)
    }
  }, [selectedDoctorId, selectedSalonId, assignmentType, surgery])

  useEffect(() => {
    fetchAssignedDates()
  }, [fetchAssignedDates])

  useEffect(() => {
    if (open) {
      setError(null)
      setSurgeryDateError(null)
      if (!surgery) {
        setAssignmentType(isWaitingList ? "waiting" : "salon")
      }
    }
  }, [open, surgery, isWaitingList])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (assignmentType === "salon") {
      const formData = new FormData(e.currentTarget)
      const selectedDate = formData.get("surgery_date") as string
      const doctorId = formData.get("responsible_doctor_id") as string
      const salonId = formData.get("salon_id") as string

      if (!selectedDate || selectedDate.trim() === "") {
        setError("Salona atarken ameliyat tarihi zorunludur")
        return
      }

      if (!salonId) {
        setError("Lütfen bir salon seçin")
        return
      }

      if (isWeekend(selectedDate)) {
        setError("Cumartesi ve Pazar günleri ameliyat yapılamaz")
        return
      }

      // Check doctor assignment mismatch with timeout
      if (doctorId && salonId && selectedDate) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

          const response = await fetch(
            `/api/doctor-assigned-dates?doctorId=${doctorId}&salonId=${salonId}&checkDate=${selectedDate}`,
            { signal: controller.signal },
          )

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.assignedDoctor && data.assignedDoctor.id !== doctorId) {
              const assignedDoctor = doctors.find((d) => d.id === data.assignedDoctor.id)
              if (assignedDoctor) {
                const confirmed = window.confirm(
                  `Bu tarihe başka bir hoca atanmış: ${assignedDoctor.name}\n\nSeçtiğiniz hoca: ${doctors.find((d) => d.id === doctorId)?.name}\n\nYine de devam etmek istiyor musunuz?`,
                )
                if (!confirmed) {
                  return
                }
              }
            }
          }
        } catch (err) {
          // Continue without check if API fails or times out
          console.log("Doctor assignment check skipped due to timeout or error")
        }
      }
    }

    // Handle surgery update
    if (surgery) {
      setIsLoading(true)

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

        if (assignmentType === "salon" && updatedData.surgery_date && isWeekend(updatedData.surgery_date)) {
          setError("Cumartesi ve Pazar günleri ameliyat yapılamaz")
          setIsLoading(false)
          return
        }

        await updateSurgery(surgery.id, updatedData)

        onOpenChange(false)
        window.dispatchEvent(new Event("calendarDataChanged"))
        window.dispatchEvent(new Event("waitingListChanged"))
        alert("Hasta bilgileri güncellendi!")
      } catch (err: any) {
        setError(err.message || "Hasta güncellenirken bir hata oluştu")
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    // Handle auto-find
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
        const result = await findAvailableDates(patientData.salon_id, patientData.responsible_doctor_id, null)

        if (result.success && result.slots && result.slots.length > 0) {
          setAvailableSlots(result.slots)
          setAutoFindOpen(true)
          setIsLoading(false)
        } else {
          await createSurgery({
            ...patientData,
            is_waiting_list: true,
            salon_id: null,
            surgery_date: "",
          })

          alert("Uygun tarih bulunamadı. Hasta bekleme listesine eklendi.")
          onOpenChange(false)
          ;(e.target as HTMLFormElement).reset()
          setPendingPatientData(null)
          window.dispatchEvent(new Event("waitingListChanged"))
          setIsLoading(false)
        }
      } catch (err: any) {
        setError(err.message || "Otomatik yer bulma sırasında bir hata oluştu")
        setIsLoading(false)
      }
      return
    }

    // Validate salon selection
    if (assignmentType === "salon" && !formData.get("salon_id")) {
      setError("Lütfen bir salon seçin veya bekleme listesine ekleyin")
      setIsLoading(false)
      return
    }

    try {
      const surgeryDateValue =
        assignmentType === "waiting" ? null : (formData.get("surgery_date") as string)?.trim() || null

      if (assignmentType === "salon" && !surgeryDateValue) {
        setError("Salona atarken ameliyat tarihi zorunludur")
        setIsLoading(false)
        return
      }

      const surgeryData = {
        patient_name: formData.get("patient_name") as string,
        protocol_number: formData.get("protocol_number") as string,
        indication: formData.get("indication") as string,
        procedure_name: formData.get("procedure_name") as string,
        responsible_doctor_id: (formData.get("responsible_doctor_id") as string) || null,
        phone_number_1: formData.get("phone_number_1") as string,
        phone_number_2: formData.get("phone_number_2") as string,
        salon_id: assignmentType === "waiting" ? null : (formData.get("salon_id") as string) || defaultSalonId || null,
        surgery_date: surgeryDateValue,
        is_waiting_list: assignmentType === "waiting",
        initial_note: formData.get("initial_note") as string,
      }

      await createSurgery(surgeryData)

      onOpenChange(false)
      ;(e.target as HTMLFormElement).reset()
      setAssignmentType(isWaitingList ? "waiting" : "salon")

      window.dispatchEvent(new Event("calendarDataChanged"))
      window.dispatchEvent(new Event("waitingListChanged"))

      alert(assignmentType === "waiting" ? "Hasta bekleme listesine eklendi!" : "Hasta salona eklendi!")
    } catch (err: any) {
      setError(err.message || "Ameliyat eklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAutoSlot = async (date: string) => {
    if (!pendingPatientData) return

    setIsSearchingSlots(true)
    try {
      await createSurgery({
        ...pendingPatientData,
        salon_id: pendingPatientData.salon_id,
        surgery_date: date,
        is_waiting_list: false,
      })

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
        window.location.href = "/fliphtml"
      }, 100)
    } catch (error: any) {
      alert(error.message || "Atama yapılırken bir hata oluştu")
    } finally {
      setIsSearchingSlots(false)
    }
  }

  const handleBackFromSlots = () => {
    setAutoFindOpen(false)
    setAvailableSlots([])
    setIsLoading(false)
    setIsSearchingSlots(false)
  }

  const handleMainDialogClose = (open: boolean) => {
    if (!open) {
      setPendingPatientData(null)
      setAvailableSlots([])
      setAutoFindOpen(false)
      setError(null)
      setSurgeryDateError(null)
      setAssignmentType(isWaitingList ? "waiting" : surgery ? (surgery.salon_id ? "salon" : "waiting") : "salon")
    }
    onOpenChange(open)
  }

  const isFormLoading = isLoading || isLoadingData

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

            {isLoadingData && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Veriler yükleniyor...</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              {!surgery && (
                <div className="space-y-3">
                  <Label>Hasta Durumu</Label>
                  <RadioGroup value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="salon" id="salon" disabled={isFormLoading} />
                      <Label htmlFor="salon" className="font-normal cursor-pointer">
                        Salona Ata
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="auto" id="auto" disabled={isFormLoading} />
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
                      <RadioGroupItem value="waiting" id="waiting" disabled={isFormLoading} />
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
                    disabled={isFormLoading}
                    defaultValue={surgery?.patient_name || pendingPatientData?.patient_name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protocol_number">Protokol Numarası</Label>
                  <Input
                    id="protocol_number"
                    name="protocol_number"
                    required
                    disabled={isFormLoading}
                    defaultValue={surgery?.protocol_number || pendingPatientData?.protocol_number || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indication">Endikasyon</Label>
                  <Input
                    id="indication"
                    name="indication"
                    required
                    disabled={isFormLoading}
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
                  disabled={isFormLoading}
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
                  disabled={isFormLoading}
                  required={assignmentType === "auto"}
                  defaultValue={
                    surgery?.responsible_doctor_id || pendingPatientData?.responsible_doctor_id || undefined
                  }
                  onValueChange={(value) => setSelectedDoctorId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={doctors.length === 0 ? "Yükleniyor..." : "Seçiniz"} />
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
                    disabled={isFormLoading}
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
                    disabled={isFormLoading}
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
                      disabled={isFormLoading}
                      required={assignmentType === "auto" || assignmentType === "salon"}
                      onValueChange={(value) => setSelectedSalonId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={salons.length === 0 ? "Yükleniyor..." : "Seçiniz"} />
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
                      <Label htmlFor="surgery_date">
                        Ameliyat Tarihi *
                        {isLoadingDates && (
                          <span className="text-xs text-muted-foreground ml-2 inline-flex items-center">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Yükleniyor...
                          </span>
                        )}
                        {!isLoadingDates && selectedDoctorId && assignedDates.size > 0 && (
                          <span className="text-xs text-blue-600 ml-2">(Sadece hoca atanmış günler seçilebilir)</span>
                        )}
                      </Label>
                      <Input
                        id="surgery_date"
                        name="surgery_date"
                        type="date"
                        defaultValue={surgery?.surgery_date || defaultDate}
                        disabled={isFormLoading}
                        required={assignmentType === "salon"}
                        min={getMinDate()}
                        onChange={(e) => {
                          if (e.target.value && isWeekend(e.target.value)) {
                            setSurgeryDateError("Cumartesi ve Pazar günleri seçilemez")
                            e.target.setCustomValidity("Cumartesi ve Pazar günleri seçilemez")
                            return
                          }

                          if (selectedDoctorId && assignedDates.size > 0 && e.target.value) {
                            if (!assignedDates.has(e.target.value)) {
                              setSurgeryDateError("Seçilen hoca bu güne atanmamış")
                              e.target.setCustomValidity("Seçilen hoca bu güne atanmamış")
                              return
                            }
                          }

                          setSurgeryDateError(null)
                          e.target.setCustomValidity("")
                        }}
                      />
                      {surgeryDateError && <p className="text-xs text-red-600">{surgeryDateError}</p>}
                    </div>
                  )}
                </div>
              )}

              {!surgery && assignmentType !== "auto" && (
                <div className="space-y-2">
                  <Label htmlFor="initial_note">Not (Opsiyonel)</Label>
                  <Textarea
                    id="initial_note"
                    name="initial_note"
                    disabled={isFormLoading}
                    rows={2}
                    placeholder="Hasta hakkında eklemek istediğiniz not..."
                  />
                </div>
              )}

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleMainDialogClose(false)}
                disabled={isFormLoading}
                className="w-full sm:w-auto"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isFormLoading || (salons.length === 0 && assignmentType !== "waiting")}
                className="w-full sm:w-auto"
              >
                {isFormLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    İşleniyor...
                  </>
                ) : surgery ? (
                  "Güncelle"
                ) : assignmentType === "waiting" ? (
                  "Bekleme Listesine Ekle"
                ) : assignmentType === "auto" ? (
                  "Otomatik Yer Bul"
                ) : (
                  "Salona Ekle"
                )}
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

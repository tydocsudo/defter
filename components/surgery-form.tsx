"use client"

import type React from "react"

import { useState } from "react"
import { createSurgery } from "@/lib/actions/surgeries"
import type { Doctor, Salon } from "@/lib/types"
import { Button } from "@/components/ui/button"
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

interface SurgeryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctors: Doctor[]
  salons: Salon[]
  defaultDate?: string
  defaultSalonId?: string
}

export function SurgeryForm({ open, onOpenChange, doctors, salons, defaultDate, defaultSalonId }: SurgeryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignmentType, setAssignmentType] = useState<"salon" | "waiting">("salon")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

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
      setAssignmentType("salon")

      // Trigger refresh events
      window.dispatchEvent(new Event("waitingListChanged"))
      window.dispatchEvent(new Event("calendarDataChanged"))

      // Show success message
      alert(assignmentType === "waiting" ? "Hasta bekleme listesine eklendi!" : "Hasta salona eklendi!")
    } catch (err: any) {
      console.error("[v0] Error creating surgery:", err)
      setError(err.message || "Ameliyat eklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Hasta Ekle</DialogTitle>
            <DialogDescription>Hastayı salona atayın veya bekleme listesine ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  <RadioGroupItem value="waiting" id="waiting" />
                  <Label htmlFor="waiting" className="font-normal cursor-pointer">
                    Bekleme Listesine Ekle
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patient_name">Hasta Adı</Label>
                <Input id="patient_name" name="patient_name" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protocol_number">Protokol Numarası</Label>
                <Input id="protocol_number" name="protocol_number" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="indication">Endikasyon</Label>
                <Input id="indication" name="indication" required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure_name">Yapılacak İşlem</Label>
              <Textarea id="procedure_name" name="procedure_name" required disabled={isLoading} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_doctor_id">Sorumlu Hoca</Label>
              <Select name="responsible_doctor_id" disabled={isLoading}>
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
                <Input id="phone_number_1" name="phone_number_1" type="tel" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number_2">Telefon 2</Label>
                <Input id="phone_number_2" name="phone_number_2" type="tel" required disabled={isLoading} />
              </div>
            </div>

            {assignmentType === "salon" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salon_id">Salon *</Label>
                  <Select name="salon_id" defaultValue={defaultSalonId} disabled={isLoading}>
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
                <div className="space-y-2">
                  <Label htmlFor="surgery_date">Ameliyat Tarihi *</Label>
                  <Input
                    id="surgery_date"
                    name="surgery_date"
                    type="date"
                    defaultValue={defaultDate}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ekleniyor..." : assignmentType === "waiting" ? "Bekleme Listesine Ekle" : "Salona Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

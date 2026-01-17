"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateSurgery } from "@/lib/actions/surgeries"
import type { SurgeryWithDetails, Doctor } from "@/lib/types"

interface SurgeryFormEditProps {
  surgery: SurgeryWithDetails
  doctors: Doctor[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SurgeryFormEdit({ surgery, doctors, open, onOpenChange, onSuccess }: SurgeryFormEditProps) {
  const [formData, setFormData] = useState({
    patient_name: surgery.patient_name,
    protocol_number: surgery.protocol_number,
    indication: surgery.indication,
    procedure_name: surgery.procedure_name,
    responsible_doctor_id: surgery.responsible_doctor_id || "",
    phone_number_1: surgery.phone_number_1,
    phone_number_2: surgery.phone_number_2,
    is_waiting_list: surgery.is_waiting_list,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateSurgery(surgery.id, {
        ...formData,
        responsible_doctor_id: formData.responsible_doctor_id || null,
        is_waiting_list: surgery.is_waiting_list,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message || "Hasta bilgileri güncellenirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hasta Bilgilerini Düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient_name">Hasta Adı Soyadı *</Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="protocol_number">Protokol Numarası *</Label>
              <Input
                id="protocol_number"
                value={formData.protocol_number}
                onChange={(e) => setFormData({ ...formData, protocol_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="indication">Endikasyon *</Label>
            <Textarea
              id="indication"
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              required
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="procedure_name">Yapılacak İşlem *</Label>
            <Textarea
              id="procedure_name"
              value={formData.procedure_name}
              onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
              required
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="responsible_doctor_id">Sorumlu Hoca</Label>
            <Select
              value={formData.responsible_doctor_id}
              onValueChange={(value) => setFormData({ ...formData, responsible_doctor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sorumlu hoca seçin" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number_1">Telefon 1 *</Label>
              <Input
                id="phone_number_1"
                placeholder="0532 111 2233"
                value={formData.phone_number_1}
                onChange={(e) => setFormData({ ...formData, phone_number_1: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone_number_2">Telefon 2 *</Label>
              <Input
                id="phone_number_2"
                placeholder="0533 444 5566"
                value={formData.phone_number_2}
                onChange={(e) => setFormData({ ...formData, phone_number_2: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

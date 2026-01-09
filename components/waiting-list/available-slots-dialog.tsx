"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Users, UserCheck, UserX } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface Patient {
  id: string
  patient_name: string
  protocol_number: string
  procedure_name: string
  indication: string
  responsible_doctor: { name: string } | null
}

interface AvailableSlot {
  date: string
  dayName: string
  currentPatientCount: number
  maxCapacity: number
  patients: Patient[]
  doctorAssigned?: boolean // Added doctorAssigned field
}

interface AvailableSlotsDialogProps {
  slots: AvailableSlot[]
  onSelectSlot: (date: string) => void
  isLoading: boolean
}

export function AvailableSlotsDialog({ slots, onSelectSlot, isLoading }: AvailableSlotsDialogProps) {
  const [assigningSlot, setAssigningSlot] = useState<string | null>(null)

  const handleSlotClick = async (date: string) => {
    if (isLoading || assigningSlot) return
    setAssigningSlot(date)
    await onSelectSlot(date)
  }

  return (
    <div className="space-y-4 py-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Uygun Tarihler</h3>
        <p className="text-sm text-muted-foreground">
          Önümüzdeki 3 ay içinde uygun olan ilk 5 tarih gösteriliyor. Bir tarih seçerek hastayı atayabilirsiniz.
        </p>
      </div>

      <div className="grid gap-4">
        {slots.map((slot) => {
          const slotDate = new Date(slot.date)
          const capacityPercentage = (slot.currentPatientCount / slot.maxCapacity) * 100
          const capacityColor =
            capacityPercentage <= 50 ? "bg-green-500" : capacityPercentage <= 80 ? "bg-yellow-500" : "bg-red-500"

          const isAssigning = assigningSlot === slot.date

          return (
            <Card
              key={slot.date}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
              onClick={() => handleSlotClick(slot.date)}
            >
              {/* Date header - similar to flipbook style */}
              <div className="bg-primary text-primary-foreground p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg capitalize">{slot.dayName}</h3>
                    <p className="text-sm opacity-90">{format(slotDate, "d MMMM yyyy", { locale: tr })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {slot.doctorAssigned !== undefined && (
                      <Badge
                        variant="secondary"
                        className={
                          slot.doctorAssigned ? "bg-green-500/20 text-green-100" : "bg-orange-500/20 text-orange-100"
                        }
                      >
                        {slot.doctorAssigned ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Hoca Atanmış
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Boş Salon
                          </>
                        )}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Users className="h-3 w-3 mr-1" />
                      {slot.currentPatientCount}/{slot.maxCapacity}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Capacity indicator */}
              <div className="h-2 bg-gray-200">
                <div className={`h-full ${capacityColor} transition-all`} style={{ width: `${capacityPercentage}%` }} />
              </div>

              {/* Patient list - similar to flipbook cards */}
              <div className="p-4">
                {slot.patients.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">Bu günde henüz ameliyat yok</p>
                    <p className="text-xs mt-1">
                      {slot.doctorAssigned
                        ? "Hoca atanmış, ilk hasta olarak bu tarihi seçebilirsiniz"
                        : "Salon boş, bu tarihi seçerek hoca ataması yapılabilir"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Mevcut Hastalar:</p>
                    {slot.patients.map((patient, index) => (
                      <div
                        key={patient.id}
                        className="border rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="font-semibold text-sm">{patient.patient_name}</div>
                            <div className="text-xs text-muted-foreground">{patient.protocol_number}</div>
                            <div className="text-xs">{patient.indication}</div>
                            <div className="text-xs text-blue-600">{patient.procedure_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {patient.responsible_doctor?.name || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Button className="w-full" disabled={isLoading || !!assigningSlot}>
                    <Check className="h-4 w-4 mr-2" />
                    {isAssigning ? "Atanıyor..." : "Bu Tarihi Seç"}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

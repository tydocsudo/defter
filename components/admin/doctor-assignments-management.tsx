"use client"

import { useState, useEffect } from "react"
import type { Salon, Doctor, DailyAssignedDoctor } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assignDoctorToDay, removeAssignedDoctor } from "@/lib/actions/notes"
import { Trash2 } from "lucide-react"
import { formatDateTurkish } from "@/lib/utils"

interface DoctorAssignmentsManagementProps {
  salons: Salon[]
  doctors: Doctor[]
}

export function DoctorAssignmentsManagement({ salons, doctors }: DoctorAssignmentsManagementProps) {
  const [selectedSalon, setSelectedSalon] = useState(salons[0]?.id || "")
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id || "")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [assignments, setAssignments] = useState<DailyAssignedDoctor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAssignments = async () => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 60)

      const res = await fetch(
        `/api/assigned-doctors?salon_id=${selectedSalon}&start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      )
      const data = await res.json()
      setAssignments(data)
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [selectedSalon])

  const handleAssign = async () => {
    setIsLoading(true)
    try {
      await assignDoctorToDay(selectedSalon, selectedDoctor, selectedDate)
      await fetchAssignments()
    } catch (error: any) {
      alert(error.message || "Hoca ataması yapılırken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (assignmentId: string) => {
    if (!confirm("Bu hoca atamasını silmek istediğinizden emin misiniz?")) return

    setIsLoading(true)
    try {
      await removeAssignedDoctor(assignmentId)
      await fetchAssignments()
    } catch (error: any) {
      alert(error.message || "Atama silinirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Hoca Ataması</CardTitle>
          <CardDescription>Bir salona ve tarihe hoca atayın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Salon</Label>
            <Select value={selectedSalon} onValueChange={setSelectedSalon}>
              <SelectTrigger>
                <SelectValue />
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
            <Label>Hoca</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue />
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
            <Label>Tarih</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          <Button onClick={handleAssign} disabled={isLoading} className="w-full">
            {isLoading ? "Atanıyor..." : "Hoca Ata"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Atamalar</CardTitle>
          <CardDescription>Seçili salon için yapılmış hoca atamaları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Henüz atama yapılmamış</p>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-semibold">{assignment.doctor?.name}</p>
                    <p className="text-sm text-gray-600">{formatDateTurkish(assignment.assigned_date)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(assignment.id)} disabled={isLoading}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

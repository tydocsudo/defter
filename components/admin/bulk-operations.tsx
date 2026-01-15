"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  bulkMoveToWaitingListByMonth,
  bulkCreateSurgeriesForDate,
  bulkReassignPatientsByDate,
} from "@/lib/actions/surgeries"
import { toast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"

const months = [
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
]

const currentYear = new Date().getFullYear()
const years = [currentYear - 1, currentYear, currentYear + 1]

export function BulkOperations({ salons, doctors }: { salons: any[]; doctors: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>("12")
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSalon, setSelectedSalon] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [bulkPatients, setBulkPatients] = useState<
    Array<{
      patient_name: string
      protocol_number: string
      indication: string
      procedure_name: string
      responsible_doctor_id: string
      phone_number_1: string
      phone_number_2: string
    }>
  >([
    {
      patient_name: "",
      protocol_number: "",
      indication: "",
      procedure_name: "",
      responsible_doctor_id: "",
      phone_number_1: "",
      phone_number_2: "",
    },
  ])
  const [isBulkCreating, setIsBulkCreating] = useState(false)

  const [reassignDate, setReassignDate] = useState<string>("")
  const [currentSalon, setCurrentSalon] = useState<string>("")
  const [newSalon, setNewSalon] = useState<string>("")
  const [newDoctor, setNewDoctor] = useState<string>("")
  const [isReassigning, setIsReassigning] = useState(false)

  const handleBulkMove = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Hata",
        description: "Lütfen ay ve yıl seçin",
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear} ayındaki tüm hastaları bekleme listesine taşımak istediğinizden emin misiniz?`,
    )

    if (!confirmed) return

    setIsLoading(true)
    try {
      const result = await bulkMoveToWaitingListByMonth(Number.parseInt(selectedYear), Number.parseInt(selectedMonth))

      toast({
        title: "Başarılı",
        description: `${result.count} hasta bekleme listesine taşındı`,
      })
    } catch (error: any) {
      console.error("Error moving patients:", error)
      toast({
        title: "Hata",
        description: error.message || "Hastalar taşınırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPatientRow = () => {
    setBulkPatients([
      ...bulkPatients,
      {
        patient_name: "",
        protocol_number: "",
        indication: "",
        procedure_name: "",
        responsible_doctor_id: "",
        phone_number_1: "",
        phone_number_2: "",
      },
    ])
  }

  const handleRemovePatientRow = (index: number) => {
    setBulkPatients(bulkPatients.filter((_, i) => i !== index))
  }

  const handlePatientChange = (index: number, field: string, value: string) => {
    const updated = [...bulkPatients]
    updated[index] = { ...updated[index], [field]: value }
    setBulkPatients(updated)
  }

  const handleBulkCreate = async () => {
    if (!selectedSalon || !selectedDate) {
      toast({
        title: "Hata",
        description: "Lütfen salon ve tarih seçin",
        variant: "destructive",
      })
      return
    }

    const validPatients = bulkPatients.filter((p) => p.patient_name && p.protocol_number)

    if (validPatients.length === 0) {
      toast({
        title: "Hata",
        description: "En az bir hasta bilgisi girmelisiniz",
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      `${validPatients.length} hastayı ${selectedDate} tarihine eklemek istediğinizden emin misiniz?`,
    )

    if (!confirmed) return

    setIsBulkCreating(true)
    try {
      const result = await bulkCreateSurgeriesForDate(selectedSalon, selectedDate, validPatients)

      toast({
        title: "Başarılı",
        description: `${result.count} hasta başarıyla eklendi`,
      })

      // Reset form
      setBulkPatients([
        {
          patient_name: "",
          protocol_number: "",
          indication: "",
          procedure_name: "",
          responsible_doctor_id: "",
          phone_number_1: "",
          phone_number_2: "",
        },
      ])
    } catch (error: any) {
      console.error("Error creating patients:", error)
      toast({
        title: "Hata",
        description: error.message || "Hastalar eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsBulkCreating(false)
    }
  }

  const handleBulkReassign = async () => {
    if (!reassignDate || !currentSalon) {
      toast({
        title: "Hata",
        description: "Lütfen tarih ve mevcut salonu seçin",
        variant: "destructive",
      })
      return
    }

    if (!newSalon && !newDoctor) {
      toast({
        title: "Hata",
        description: "Lütfen en az bir değişiklik seçin (yeni salon veya yeni hoca)",
        variant: "destructive",
      })
      return
    }

    const changes = []
    if (newSalon) changes.push(`Salon: ${salons.find((s) => s.id === newSalon)?.name}`)
    if (newDoctor) changes.push(`Hoca: ${doctors.find((d) => d.id === newDoctor)?.name}`)

    const confirmed = window.confirm(
      `${reassignDate} tarihindeki ${salons.find((s) => s.id === currentSalon)?.name} salonundaki tüm hastaları aşağıdaki değişikliklerle güncellemek istediğinizden emin misiniz?\n\n${changes.join("\n")}`,
    )

    if (!confirmed) return

    setIsReassigning(true)
    try {
      const result = await bulkReassignPatientsByDate(reassignDate, currentSalon, {
        newSalonId: newSalon || undefined,
        newDoctorId: newDoctor || undefined,
      })

      toast({
        title: "Başarılı",
        description: `${result.count} hasta güncellendi`,
      })

      // Reset form
      setReassignDate("")
      setCurrentSalon("")
      setNewSalon("")
      setNewDoctor("")
    } catch (error: any) {
      console.error("Error reassigning patients:", error)
      toast({
        title: "Hata",
        description: error.message || "Hastalar güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsReassigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 dark:bg-slate-800">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Aylık Toplu İşlemler</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="year" className="dark:text-slate-200">
              Yıl
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Yıl seçin" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)} className="dark:text-white dark:focus:bg-slate-600">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="month" className="dark:text-slate-200">
              Ay
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Ay seçin" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="dark:text-white dark:focus:bg-slate-600">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleBulkMove}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Seçili Aydaki Tüm Hastaları Bekleme Listesine Taşı
          </Button>
        </div>
      </Card>

      <Card className="p-6 dark:bg-slate-800">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Toplu Hasta Ekleme</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bulk-salon" className="dark:text-slate-200">
                Salon
              </Label>
              <Select value={selectedSalon} onValueChange={setSelectedSalon}>
                <SelectTrigger id="bulk-salon" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder="Salon seçin" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                  {salons.map((salon) => (
                    <SelectItem key={salon.id} value={salon.id} className="dark:text-white dark:focus:bg-slate-600">
                      {salon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-date" className="dark:text-slate-200">
                Tarih
              </Label>
              <Input
                id="bulk-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="dark:text-slate-200">Hastalar</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddPatientRow}
                className="dark:bg-slate-700 dark:text-white dark:border-slate-600 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                Hasta Ekle
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bulkPatients.map((patient, index) => (
                <Card key={index} className="p-4 dark:bg-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Hasta Adı *"
                      value={patient.patient_name}
                      onChange={(e) => handlePatientChange(index, "patient_name", e.target.value)}
                      className="dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    />
                    <Input
                      placeholder="Protokol No *"
                      value={patient.protocol_number}
                      onChange={(e) => handlePatientChange(index, "protocol_number", e.target.value)}
                      className="dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    />
                    <Input
                      placeholder="Endikasyon"
                      value={patient.indication}
                      onChange={(e) => handlePatientChange(index, "indication", e.target.value)}
                      className="dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    />
                    <Input
                      placeholder="İşlem Adı"
                      value={patient.procedure_name}
                      onChange={(e) => handlePatientChange(index, "procedure_name", e.target.value)}
                      className="dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    />
                    <Input
                      placeholder="Telefon 1 *"
                      value={patient.phone_number_1}
                      onChange={(e) => handlePatientChange(index, "phone_number_1", e.target.value)}
                      className="dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    />
                    <Input
                      placeholder="Telefon 2"
                      value={patient.phone_number_2}
                      onChange={(e) => handlePatientChange(index, "phone_number_2", e.target.value)}
                      className="dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    />
                    <Select
                      value={patient.responsible_doctor_id}
                      onValueChange={(value) => handlePatientChange(index, "responsible_doctor_id", value)}
                    >
                      <SelectTrigger className="dark:bg-slate-600 dark:border-slate-500 dark:text-white">
                        <SelectValue placeholder="Sorumlu Hoca" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        {doctors.map((doctor) => (
                          <SelectItem
                            key={doctor.id}
                            value={doctor.id}
                            className="dark:text-white dark:focus:bg-slate-600"
                          >
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 col-span-2">
                      {bulkPatients.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => handleRemovePatientRow(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={handleBulkCreate}
            disabled={isBulkCreating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isBulkCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {bulkPatients.filter((p) => p.patient_name && p.protocol_number).length} Hastayı Ekle
          </Button>
        </div>
      </Card>

      <Card className="p-6 dark:bg-slate-800">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Günlük Toplu Yeniden Atama</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reassign-date" className="dark:text-slate-200">
              Tarih
            </Label>
            <Input
              id="reassign-date"
              type="date"
              value={reassignDate}
              onChange={(e) => setReassignDate(e.target.value)}
              className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="current-salon" className="dark:text-slate-200">
              Mevcut Salon
            </Label>
            <Select value={currentSalon} onValueChange={setCurrentSalon}>
              <SelectTrigger id="current-salon" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Mevcut salonu seçin" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {salons.map((salon) => (
                  <SelectItem key={salon.id} value={salon.id} className="dark:text-white dark:focus:bg-slate-600">
                    {salon.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <Label className="dark:text-slate-200 mb-3 block">Değiştirilecek Alanlar (İsteğe Bağlı)</Label>

            <div className="space-y-3">
              <div>
                <Label htmlFor="new-salon" className="text-sm dark:text-slate-300">
                  Yeni Salon
                </Label>
                <Select value={newSalon} onValueChange={setNewSalon}>
                  <SelectTrigger id="new-salon" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <SelectValue placeholder="Yeni salon seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectItem value="none" className="dark:text-white dark:focus:bg-slate-600">
                      Değiştirme
                    </SelectItem>
                    {salons.map((salon) => (
                      <SelectItem key={salon.id} value={salon.id} className="dark:text-white dark:focus:bg-slate-600">
                        {salon.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="new-doctor" className="text-sm dark:text-slate-300">
                  Yeni Hoca
                </Label>
                <Select value={newDoctor} onValueChange={setNewDoctor}>
                  <SelectTrigger id="new-doctor" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <SelectValue placeholder="Yeni hoca seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectItem value="none" className="dark:text-white dark:focus:bg-slate-600">
                      Değiştirme
                    </SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id} className="dark:text-white dark:focus:bg-slate-600">
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleBulkReassign}
            disabled={isReassigning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isReassigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hastaları Toplu Güncelle
          </Button>
        </div>
      </Card>
    </div>
  )
}

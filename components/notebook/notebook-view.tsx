"use client"

import { useState } from "react"
import type { SurgeryWithDetails, Salon } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { formatDateTurkish } from "@/lib/utils"

interface NotebookViewProps {
  surgeries: SurgeryWithDetails[]
  salons: Salon[] // Added salons prop
  year: number
}

export function NotebookView({ surgeries, salons, year }: NotebookViewProps) {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeapYear ? 366 : 365

  const [currentDay, setCurrentDay] = useState(0)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [jumpToMonth, setJumpToMonth] = useState(0)

  const getCurrentDate = (dayNumber: number) => {
    const date = new Date(year, 0, 1)
    date.setDate(date.getDate() + dayNumber)
    return date
  }

  const currentDate = getCurrentDate(currentDay)
  const dateStr = currentDate.toISOString().split("T")[0]

  const daySurgeries = surgeries.filter((s) => s.surgery_date === dateStr)

  const surgeriesBySalon = salons.map((salon) => ({
    salon,
    surgeries: daySurgeries.filter((s) => s.salon?.id === salon.id),
  }))

  const nextDay = () => {
    if (currentDay < daysInYear - 1) {
      setCurrentDay(currentDay + 1)
    }
  }

  const prevDay = () => {
    if (currentDay > 0) {
      setCurrentDay(currentDay - 1)
    }
  }

  const jumpToDate = (month: number, day: number) => {
    const targetDate = new Date(year, month, day)
    const startOfYear = new Date(year, 0, 1)
    const diffTime = targetDate.getTime() - startOfYear.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    setCurrentDay(diffDays)
    setShowDatePicker(false)
  }

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative">
        {/* Date Picker Modal */}
        {showDatePicker && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDatePicker(false)}
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Tarihe Git</h3>
              <div className="space-y-4">
                <select
                  className="w-full border rounded p-2"
                  value={jumpToMonth}
                  onChange={(e) => setJumpToMonth(Number.parseInt(e.target.value))}
                >
                  {monthNames.map((month, i) => (
                    <option key={i} value={i}>
                      {month}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: new Date(year, jumpToMonth + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      onClick={() => jumpToDate(jumpToMonth, day)}
                      className="p-2 border rounded hover:bg-blue-50 text-sm"
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notebook Container */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg shadow-2xl p-8 border-4 border-amber-900/20">
          {/* Page Number and Date Picker */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 font-serif">
              Gün {currentDay + 1} / {daysInYear}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDatePicker(true)} className="gap-2">
              <Calendar className="h-4 w-4" />
              Tarihe Git
            </Button>
          </div>

          {/* Notebook Lines Background */}
          <div
            className="bg-white rounded shadow-inner min-h-[700px] p-8 relative"
            style={{
              backgroundImage: `repeating-linear-gradient(
                white,
                white 39px,
                #e5e7eb 39px,
                #e5e7eb 40px
              )`,
            }}
          >
            {/* Red Margin Line */}
            <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-red-400" />

            {/* Content */}
            <div className="relative pl-8 space-y-6">
              <div className="text-center pb-4 border-b-2 border-gray-800">
                <h2 className="text-3xl font-bold font-serif text-gray-900">{formatDateTurkish(dateStr)}</h2>
                <p className="text-lg text-gray-700 mt-2 font-serif">{dayNames[currentDate.getDay()]}</p>
                <p className="text-sm text-gray-600 mt-2 font-serif">
                  {daySurgeries.length} ameliyat - {salons.length} salon
                </p>
              </div>

              {daySurgeries.length > 0 ? (
                <div className="space-y-8">
                  {surgeriesBySalon.map((item) => (
                    <div key={item.salon.id} className="space-y-4">
                      {/* Salon Header */}
                      <div className="bg-blue-100 border-l-4 border-blue-600 p-3 rounded">
                        <h3 className="text-2xl font-bold font-serif text-blue-900">{item.salon.name}</h3>
                        <p className="text-sm text-blue-700 font-serif">{item.surgeries.length} ameliyat</p>
                      </div>

                      {/* Surgeries for this salon */}
                      {item.surgeries.length > 0 ? (
                        <div className="space-y-6 pl-4">
                          {item.surgeries.map((surgery, index) => (
                            <div key={surgery.id} className="pb-4 border-b border-gray-300 last:border-0">
                              <div className="font-serif space-y-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-bold text-xl text-gray-900">{index + 1}.</span>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <span className="font-bold text-xl text-gray-900">{surgery.patient_name}</span>
                                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {surgery.protocol_number}
                                      </span>
                                    </div>

                                    <div className="space-y-2 text-gray-800">
                                      <p className="text-lg">
                                        <span className="font-semibold">Endikasyon:</span> {surgery.indication}
                                      </p>
                                      <p className="text-lg">
                                        <span className="font-semibold text-blue-700">İşlem →</span>{" "}
                                        <span className="font-bold text-blue-900">{surgery.procedure_name}</span>
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                      <div>
                                        <p className="font-semibold text-gray-900">Sorumlu Hoca:</p>
                                        <p>{surgery.responsible_doctor?.name || "-"}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">Salon:</p>
                                        <p>{surgery.salon?.name || "-"}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">Kıdemli:</p>
                                        <p>{surgery.senior_resident?.name || surgery.senior_resident_custom || "-"}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">Çömez:</p>
                                        <p>{surgery.junior_resident?.name || surgery.junior_resident_custom || "-"}</p>
                                      </div>
                                    </div>

                                    <div className="flex gap-4 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                      <p>📞 {surgery.phone_number_1}</p>
                                      <p>📞 {surgery.phone_number_2}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4 font-serif text-sm italic pl-4">
                          Bu salonda ameliyat yok
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12 font-serif text-lg">
                  Bu gün için ameliyat planlanmamış
                </div>
              )}
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              onClick={prevDay}
              disabled={currentDay === 0}
              variant="outline"
              size="sm"
              className="gap-2 bg-white/80"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki Gün
            </Button>

            <span className="text-sm text-gray-700 font-serif">
              {year} Yılı - {daySurgeries.length} ameliyat
            </span>

            <Button
              onClick={nextDay}
              disabled={currentDay === daysInYear - 1}
              variant="outline"
              size="sm"
              className="gap-2 bg-white/80"
            >
              Sonraki Gün
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

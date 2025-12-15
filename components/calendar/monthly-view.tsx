"use client"

import { useState, useEffect, useCallback } from "react"
import type { Salon, Doctor, SurgeryWithDetails, DayNote, DailyAssignedDoctor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MonthlyCalendar } from "./monthly-calendar"
import { DayDetailsPanel } from "./day-details-panel"
import { DailyOperationsList } from "./daily-operations-list"
import { WaitingListSidebar } from "./waiting-list-sidebar"
import { formatDateTurkish } from "@/lib/utils"

interface MonthlyViewProps {
  salons: Salon[]
  doctors: Doctor[]
  isAdmin: boolean
}

export function MonthlyView({ salons, doctors, isAdmin }: MonthlyViewProps) {
  const [selectedSalon, setSelectedSalon] = useState<string>(salons[0]?.id || "")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [surgeries, setSurgeries] = useState<SurgeryWithDetails[]>([])
  const [dayNotes, setDayNotes] = useState<DayNote[]>([])
  const [assignedDoctors, setAssignedDoctors] = useState<DailyAssignedDoctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDayNotes, setShowDayNotes] = useState(false)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0]
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0]

      const [surgeriesRes, notesRes, doctorsRes] = await Promise.all([
        fetch(`/api/surgeries?salon_id=${selectedSalon}&start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/day-notes?salon_id=${selectedSalon}&start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/assigned-doctors?salon_id=${selectedSalon}&start_date=${startDate}&end_date=${endDate}`),
      ])

      const [surgeriesData, notesData, doctorsData] = await Promise.all([
        surgeriesRes.json(),
        notesRes.json(),
        doctorsRes.json(),
      ])

      setSurgeries(surgeriesData)
      setDayNotes(notesData)
      setAssignedDoctors(doctorsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSalon, currentYear, currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleWaitingListChange = () => {
      console.log("[v0] Waiting list changed event received, refreshing data")
      fetchData()
    }

    const handleCalendarDataChange = () => {
      console.log("[v0] Calendar data changed event received, refreshing data")
      fetchData()
    }

    window.addEventListener("waitingListChanged", handleWaitingListChange)
    window.addEventListener("calendarDataChanged", handleCalendarDataChange)

    return () => {
      window.removeEventListener("waitingListChanged", handleWaitingListChange)
      window.removeEventListener("calendarDataChanged", handleCalendarDataChange)
    }
  }, [fetchData])

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedDate(null)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
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

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="hidden lg:flex lg:flex-row gap-4">
          <div className="lg:w-80 flex-shrink-0">
            <WaitingListSidebar salons={salons} doctors={doctors} onDataChange={fetchData} />
          </div>

          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex-shrink-0">Aylık Takvim</CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousMonth}
                        className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-transparent"
                      >
                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap min-w-[110px] sm:min-w-[130px] text-center">
                        {monthNames[currentMonth]} {currentYear}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-transparent"
                      >
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  <Select value={selectedSalon} onValueChange={setSelectedSalon}>
                    <SelectTrigger className="w-full sm:w-auto">
                      <SelectValue placeholder="Salon Seçin" />
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
              </CardHeader>
              <CardContent className="p-1 sm:p-2 md:p-4 lg:p-6">
                {isLoading ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">Yükleniyor...</div>
                ) : (
                  <MonthlyCalendar
                    currentDate={currentDate}
                    surgeries={surgeries}
                    dayNotes={dayNotes}
                    assignedDoctors={assignedDoctors}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    doctors={doctors}
                    isAdmin={isAdmin}
                    salonId={selectedSalon}
                    onDataChange={fetchData}
                  />
                )}
              </CardContent>
            </Card>

            {selectedDate && (
              <Card className="mt-3 sm:mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm md:text-base">
                      Gün Notları - {formatDateTurkish(selectedDate)}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDayNotes(!showDayNotes)}
                      className="text-xs sm:text-sm"
                    >
                      {showDayNotes ? "Gizle" : "Göster"}
                    </Button>
                  </div>
                </CardHeader>
                {showDayNotes && (
                  <CardContent>
                    <DayDetailsPanel
                      selectedDate={selectedDate}
                      salonId={selectedSalon}
                      surgeries={surgeries}
                      dayNotes={dayNotes}
                      doctors={doctors}
                      salons={salons}
                      onDataChange={fetchData}
                    />
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>

        <div className="lg:hidden">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base flex-shrink-0">Aylık Takvim</CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreviousMonth}
                      className="h-8 w-8 bg-transparent"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium whitespace-nowrap min-w-[110px] text-center">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 bg-transparent">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Select value={selectedSalon} onValueChange={setSelectedSalon}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Salon Seçin" />
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
            </CardHeader>
            <CardContent className="p-1">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500 text-sm">Yükleniyor...</div>
              ) : (
                <MonthlyCalendar
                  currentDate={currentDate}
                  surgeries={surgeries}
                  dayNotes={dayNotes}
                  assignedDoctors={assignedDoctors}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  doctors={doctors}
                  isAdmin={isAdmin}
                  salonId={selectedSalon}
                  onDataChange={fetchData}
                />
              )}
            </CardContent>
          </Card>

          {selectedDate && (
            <Card className="mt-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs sm:text-sm">Gün Notları - {formatDateTurkish(selectedDate)}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowDayNotes(!showDayNotes)} className="text-xs">
                    {showDayNotes ? "Gizle" : "Göster"}
                  </Button>
                </div>
              </CardHeader>
              {showDayNotes && (
                <CardContent>
                  <DayDetailsPanel
                    selectedDate={selectedDate}
                    salonId={selectedSalon}
                    surgeries={surgeries}
                    dayNotes={dayNotes}
                    doctors={doctors}
                    salons={salons}
                    onDataChange={fetchData}
                  />
                </CardContent>
              )}
            </Card>
          )}

          <div className="mt-4">
            <WaitingListSidebar salons={salons} doctors={doctors} onDataChange={fetchData} />
          </div>
        </div>
      </div>

      {selectedDate && (
        <DailyOperationsList
          date={selectedDate}
          salonId={selectedSalon}
          salon={salons.find((s) => s.id === selectedSalon)}
          surgeries={surgeries.filter((s) => s.surgery_date === selectedDate)}
          dayNotes={dayNotes.filter((n) => n.note_date === selectedDate)}
          doctors={doctors}
          salons={salons}
          onDataChange={fetchData}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import type { Salon, Doctor, SurgeryWithDetails, DayNote, DailyAssignedDoctor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { MonthlyCalendar } from "./monthly-calendar"
import { FlipbookOperationsList } from "@/components/flipbook/flipbook-operations-list"
import { DoctorFilter } from "@/components/doctor-filter"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface MonthlyViewProps {
  salons: Salon[]
  doctors: Doctor[]
  isAdmin: boolean
  initialSurgeries?: SurgeryWithDetails[]
  initialDayNotes?: DayNote[]
}

export function MonthlyView({
  salons,
  doctors,
  isAdmin,
  initialSurgeries = [],
  initialDayNotes = [],
}: MonthlyViewProps) {
  const [selectedSalon, setSelectedSalon] = useState<string>(salons[0]?.id || "")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [surgeries, setSurgeries] = useState<SurgeryWithDetails[]>(initialSurgeries)
  const [dayNotes, setDayNotes] = useState<DayNote[]>(initialDayNotes)
  const [assignedDoctors, setAssignedDoctors] = useState<DailyAssignedDoctor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showOperationsList, setShowOperationsList] = useState(false)
  const [hasUsedInitialData, setHasUsedInitialData] = useState(false)
  const [filteredDoctors, setFilteredDoctors] = useState<string[]>([])

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [surgeriesRes, notesRes, doctorsRes] = await Promise.all([
        fetch(`/api/surgeries?salon_id=${selectedSalon}&is_waiting_list=false`),
        fetch(`/api/day-notes?salon_id=${selectedSalon}`),
        fetch(`/api/assigned-doctors?salon_id=${selectedSalon}`),
      ])

      let surgeriesData = []
      let notesData = []
      let doctorsData = []

      if (surgeriesRes.ok) {
        try {
          surgeriesData = await surgeriesRes.json()
        } catch (error) {
          // Skip parse errors
        }
      }

      if (notesRes.ok) {
        try {
          notesData = await notesRes.json()
        } catch (error) {
          // Skip parse errors
        }
      }

      if (doctorsRes.ok) {
        try {
          doctorsData = await doctorsRes.json()
        } catch (error) {
          // Skip parse errors
        }
      }

      setSurgeries(surgeriesData)
      setDayNotes(notesData)
      setAssignedDoctors(doctorsData)
    } catch (error) {
      // Skip fetch errors
    } finally {
      setIsLoading(false)
    }
  }, [selectedSalon])

  useEffect(() => {
    if (!hasUsedInitialData) {
      setHasUsedInitialData(true)
      return
    }

    fetchData()
  }, [selectedSalon, fetchData, hasUsedInitialData])

  useEffect(() => {
    const handleWaitingListChange = () => {
      fetchData()
    }

    const handleCalendarDataChange = () => {
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
    setShowOperationsList(true)
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
        <Card className="mx-px my-0 px-0 leading-7 border-4">
          <CardHeader>
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <CardTitle className="text-sm sm:text-base md:text-lg flex-shrink-0">Aylık Takvim</CardTitle>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <DoctorFilter
                    doctors={doctors}
                    selectedDoctors={filteredDoctors}
                    onSelectionChange={setFilteredDoctors}
                    multiSelect={true}
                  />
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
          <CardContent className="p-2 sm:p-3 md:p-4">
            {isLoading ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">Yükleniyor...</div>
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
                filteredDoctors={filteredDoctors}
              />
            )}
          </CardContent>
        </Card>

        {selectedDate && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <Button
                variant="ghost"
                onClick={() => setShowOperationsList(!showOperationsList)}
                className="w-full flex items-center justify-between hover:bg-muted"
              >
                <div className="text-base">
                  Günlük Ameliyat Listesi - {format(new Date(selectedDate), "d MMMM yyyy EEEE", { locale: tr })}
                </div>
                {showOperationsList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            {showOperationsList && (
              <CardContent>
                <FlipbookOperationsList
                  selectedDate={new Date(selectedDate)}
                  surgeries={surgeries}
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
  )
}

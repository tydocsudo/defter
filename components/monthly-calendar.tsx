"use client"
import { cn } from "@/lib/utils"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState } from "react"

// Define MonthlyCalendarProps interface
interface MonthlyCalendarProps {
  currentDate: Date
  surgeries: any[]
  dayNotes: any[]
  assignedDoctors: any[]
  selectedDate: Date
  onDateSelect: (date: string) => void
  doctors: any[]
  isAdmin: boolean
  salonId: string
  onDataChange: (data: any) => void
  filteredDoctors?: any[]
}

export function MonthlyCalendar({
  currentDate,
  surgeries,
  dayNotes,
  assignedDoctors,
  selectedDate,
  onDateSelect,
  doctors,
  isAdmin,
  salonId,
  onDataChange,
  filteredDoctors = [],
}: MonthlyCalendarProps) {
  const [days, setDays] = useState([]) // Initialize days state
  const [isSelected, setIsSelected] = useState(false) // Initialize isSelected state
  const [isToday, setIsToday] = useState(false) // Initialize isToday state
  const [doctorHighlight, setDoctorHighlight] = useState(null) // Initialize doctorHighlight state
  const [isDraggedOver, setIsDraggedOver] = useState(false) // Initialize isDraggedOver state
  const [assignedDoctor, setAssignedDoctor] = useState(null) // Initialize assignedDoctor state
  const [isAssigning, setIsAssigning] = useState(false) // Initialize isAssigning state

  // Function to handle drag over
  const handleDragOver = (e: any, day: any) => {
    e.preventDefault()
    setIsDraggedOver(true)
  }

  // Function to handle drag leave
  const handleDragLeave = () => {
    setIsDraggedOver(false)
  }

  // Function to handle drop
  const handleDrop = (e: any, day: any) => {
    e.preventDefault()
    setIsDraggedOver(false)
    // Handle drop logic here
  }

  // Function to handle doctor assignment
  const handleDoctorAssign = (day: any, value: any) => {
    // Handle doctor assignment logic here
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {days.map((day, index) => {
            const dateStr = day.toString() // Declare dateStr variable
            const isToday = new Date().toString() === dateStr // Determine if the day is today
            const isSelected = selectedDate.toString() === dateStr // Determine if the day is selected
            const assignedDoctor = assignedDoctors.find((doctor) => doctor.day === day) // Find assigned doctor for the day
            const doctorHighlight = assignedDoctor ? { bg: "bg-green-50", border: "border-green-400" } : null // Highlight assigned doctor

            return (
              <div
                key={day}
                className={cn(
                  "rounded-lg p-1 sm:p-1.5 md:p-2 cursor-pointer transition-all hover:shadow-lg relative min-h-[160px] sm:min-h-[200px] lg:min-h-[240px] flex flex-col border-2 gap-0 my-1 md:px-2 mx-1",
                  isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
                  isToday && !isSelected && "bg-yellow-50 dark:bg-yellow-950 border-yellow-400",
                  !isSelected && !isToday && !doctorHighlight && "bg-card hover:bg-muted",
                  isDraggedOver && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950",
                  doctorHighlight && !isSelected && `${doctorHighlight.bg} ${doctorHighlight.border} border-2`,
                )}
                onClick={() => onDateSelect(dateStr)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-0.5 sm:mb-1 flex-shrink-0">
                    {/* Display day information here */}
                  </div>

                  {/* Allow all users to assign doctors */}
                  {!assignedDoctor && (
                    <Select onValueChange={(value) => handleDoctorAssign(day, value)} disabled={isAssigning}>
                      <SelectTrigger className="h-5 sm:h-6 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1 border-dashed">
                        <SelectValue placeholder="Hoca" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Display other day information here */}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Display other calendar information here */}
    </>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X } from "lucide-react"
import type { Doctor } from "@/lib/types"

const DOCTOR_COLORS = [
  {
    bg: "bg-blue-200 dark:bg-blue-700/60",
    border: "border-blue-500 dark:border-blue-400",
    text: "text-blue-800 dark:text-blue-100",
    ring: "ring-blue-500",
  },
  {
    bg: "bg-green-200 dark:bg-green-700/60",
    border: "border-green-500 dark:border-green-400",
    text: "text-green-800 dark:text-green-100",
    ring: "ring-green-500",
  },
  {
    bg: "bg-purple-200 dark:bg-purple-700/60",
    border: "border-purple-500 dark:border-purple-400",
    text: "text-purple-800 dark:text-purple-100",
    ring: "ring-purple-500",
  },
  {
    bg: "bg-orange-200 dark:bg-orange-700/60",
    border: "border-orange-500 dark:border-orange-400",
    text: "text-orange-800 dark:text-orange-100",
    ring: "ring-orange-500",
  },
  {
    bg: "bg-pink-200 dark:bg-pink-700/60",
    border: "border-pink-500 dark:border-pink-400",
    text: "text-pink-800 dark:text-pink-100",
    ring: "ring-pink-500",
  },
  {
    bg: "bg-cyan-200 dark:bg-cyan-700/60",
    border: "border-cyan-500 dark:border-cyan-400",
    text: "text-cyan-800 dark:text-cyan-100",
    ring: "ring-cyan-500",
  },
  {
    bg: "bg-amber-200 dark:bg-amber-700/60",
    border: "border-amber-500 dark:border-amber-400",
    text: "text-amber-800 dark:text-amber-100",
    ring: "ring-amber-500",
  },
  {
    bg: "bg-indigo-200 dark:bg-indigo-700/60",
    border: "border-indigo-500 dark:border-indigo-400",
    text: "text-indigo-800 dark:text-indigo-100",
    ring: "ring-indigo-500",
  },
]

export function getDoctorColor(index: number) {
  return DOCTOR_COLORS[index % DOCTOR_COLORS.length]
}

export function getDoctorColorById(doctorId: string, selectedDoctors: string[]) {
  const index = selectedDoctors.indexOf(doctorId)
  if (index === -1) return null
  return getDoctorColor(index)
}

interface DoctorFilterProps {
  doctors: Doctor[]
  selectedDoctors: string[]
  onSelectionChange: (doctorIds: string[]) => void
  multiSelect?: boolean
}

export function DoctorFilter({ doctors, selectedDoctors, onSelectionChange, multiSelect = true }: DoctorFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDoctorToggle = (doctorId: string) => {
    if (multiSelect) {
      if (selectedDoctors.includes(doctorId)) {
        onSelectionChange(selectedDoctors.filter((id) => id !== doctorId))
      } else {
        onSelectionChange([...selectedDoctors, doctorId])
      }
    } else {
      if (selectedDoctors.includes(doctorId)) {
        onSelectionChange([])
      } else {
        onSelectionChange([doctorId])
      }
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${
            selectedDoctors.length > 0
              ? "bg-blue-500/30 border-blue-400 text-white"
              : "bg-white/10 border-white/20 hover:bg-white/20 text-white"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Hoca Filtresi</span>
          {selectedDoctors.length > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
              {selectedDoctors.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 dark:bg-slate-800 dark:border-slate-600" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm dark:text-slate-100">Hoca Seçimi</h4>
            {selectedDoctors.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs dark:text-slate-100">
                <X className="h-3 w-3 mr-1" />
                Temizle
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {doctors.map((doctor) => {
              const isSelected = selectedDoctors.includes(doctor.id)
              const colorIndex = selectedDoctors.indexOf(doctor.id)
              const color = colorIndex >= 0 ? getDoctorColor(colorIndex) : null

              return (
                <div
                  key={doctor.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted dark:hover:bg-slate-700 transition-colors ${
                    isSelected && color ? `${color.bg} ${color.border} border` : ""
                  }`}
                  onClick={() => handleDoctorToggle(doctor.id)}
                >
                  <Checkbox checked={isSelected} className="dark:border-slate-400" />
                  <span className={`text-sm ${isSelected && color ? color.text : "dark:text-slate-100"}`}>
                    {doctor.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

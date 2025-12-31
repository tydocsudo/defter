"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, Calendar, MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { createBrowserClient } from "@/lib/supabase/client"

interface Surgery {
  id: string
  patient_name: string
  protocol_number: string | null
  indication: string | null
  surgery_date: string | null
  salon_id: string | null
  salon?: { id: string; name: string } | null
}

interface PatientSearchProps {
  onSelectPatient: (date: string, salonId: string | null) => void
}

export function PatientSearch({ onSelectPatient }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Surgery[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search patients when query changes
  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from("surgeries")
          .select(`
            id,
            patient_name,
            protocol_number,
            indication,
            surgery_date,
            salon_id,
            salon:salons(id, name)
          `)
          .eq("is_waiting_list", false)
          .not("surgery_date", "is", null)
          .or(
            `patient_name.ilike.%${searchQuery}%,protocol_number.ilike.%${searchQuery}%,indication.ilike.%${searchQuery}%`,
          )
          .order("surgery_date", { ascending: false })
          .limit(10)

        if (!error && data) {
          setSearchResults(data as Surgery[])
          setIsOpen(true)
        }
      } catch (error) {
        console.error("[v0] Error searching patients:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchPatients, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSelectPatient = (surgery: Surgery) => {
    if (surgery.surgery_date) {
      onSelectPatient(surgery.surgery_date, surgery.salon_id)
      setSearchQuery("")
      setSearchResults([])
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            placeholder="Hasta Bul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[140px] sm:w-[180px] pl-8 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
                setIsOpen(false)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-[320px] bg-white rounded-lg shadow-xl border z-50 max-h-[400px] overflow-auto">
          {searchResults.map((surgery) => (
            <button
              key={surgery.id}
              className="w-full p-3 text-left hover:bg-slate-50 border-b last:border-b-0 transition-colors"
              onClick={() => handleSelectPatient(surgery)}
            >
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{surgery.patient_name}</p>
                  {surgery.protocol_number && (
                    <p className="text-xs text-slate-500">Protokol: {surgery.protocol_number}</p>
                  )}
                  {surgery.indication && <p className="text-xs text-slate-600 truncate">{surgery.indication}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {surgery.surgery_date && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(surgery.surgery_date), "d MMMM yyyy", { locale: tr })}
                      </div>
                    )}
                    {surgery.salon && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <MapPin className="h-3 w-3" />
                        {surgery.salon.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 mt-1 w-[280px] bg-white rounded-lg shadow-xl border z-50 p-4 text-center text-slate-500 text-sm">
          Hasta bulunamadı
        </div>
      )}

      {/* Loading state */}
      {isSearching && (
        <div className="absolute top-full left-0 mt-1 w-[280px] bg-white rounded-lg shadow-xl border z-50 p-4 text-center text-slate-500 text-sm">
          Aranıyor...
        </div>
      )}
    </div>
  )
}

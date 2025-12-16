"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ClipboardList, Plus } from "lucide-react"
import Link from "next/link"
import { SurgeryForm } from "./surgery-form"
import type { Doctor, Salon } from "@/lib/types"

interface AddSurgeryButtonProps {
  salons: Salon[]
  doctors: Doctor[]
}

export function AddSurgeryButton({ salons, doctors }: AddSurgeryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <Button onClick={() => setIsOpen(true)} className="gap-2 w-full">
          <Plus className="h-4 w-4" />
          Hasta Ekle
        </Button>
        <Link href="/waiting-list" className="w-full">
          <Button variant="secondary" className="gap-2 w-full">
            <ClipboardList className="h-4 w-4" />
            Bekleme Listesi
          </Button>
        </Link>
      </div>

      <SurgeryForm open={isOpen} onOpenChange={setIsOpen} salons={salons} doctors={doctors} />
    </>
  )
}

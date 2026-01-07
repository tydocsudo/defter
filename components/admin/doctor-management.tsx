"use client"

import type React from "react"

import { useState } from "react"
import type { Doctor } from "@/lib/types"
import { createDoctor, deleteDoctor } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Trash2 } from "lucide-react"

interface DoctorManagementProps {
  doctors: Doctor[]
}

export function DoctorManagement({ doctors }: DoctorManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log("[v0] DoctorManagement component - doctors prop:", doctors.length, doctors)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string

    console.log("[v0] Creating doctor with name:", name)

    try {
      const result = await createDoctor(name)
      console.log("[v0] Doctor created, result:", result)
      setIsDialogOpen(false)
      ;(e.target as HTMLFormElement).reset()
      window.location.reload()
    } catch (err: any) {
      console.error("[v0] Error creating doctor:", err)
      setError(err.message || "Hoca eklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (doctorId: string) => {
    if (!confirm("Bu hocayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return
    }

    try {
      await deleteDoctor(doctorId)
    } catch (err: any) {
      alert(err.message || "Hoca silinirken bir hata oluştu")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Hocalar</CardTitle>
            <CardDescription>Sistemdeki hocaları görüntüleyin ve yönetin</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Yeni Hoca
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yeni Hoca Ekle</DialogTitle>
                  <DialogDescription>Sisteme yeni bir hoca ekleyin</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hoca Adı Soyadı</Label>
                    <Input id="name" name="name" placeholder="Örn: Dr. Ahmet Yılmaz" required disabled={isLoading} />
                  </div>
                  {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hoca Adı Soyadı</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">{doctor.name}</TableCell>
                <TableCell>{new Date(doctor.created_at).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doctor.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

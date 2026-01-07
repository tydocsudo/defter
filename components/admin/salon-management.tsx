"use client"

import type React from "react"

import { useState } from "react"
import type { Salon } from "@/lib/types"
import { createSalon, deleteSalon } from "@/lib/actions/admin"
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
import { Plus, Trash2 } from "lucide-react"

interface SalonManagementProps {
  salons: Salon[]
}

export function SalonManagement({ salons }: SalonManagementProps) {
  console.log("[v0] SalonManagement component - salons prop:", salons.length, salons) // Added debug logging to see what salons are received

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string

    console.log("[v0] Submitting salon creation with name:", name) // Added debug logging

    try {
      const result = await createSalon(name) // Store result
      console.log("[v0] Salon created successfully, result:", result) // Added debug logging
      setIsDialogOpen(false)
      ;(e.target as HTMLFormElement).reset()
      window.location.reload() // Force page reload to show new salon
    } catch (err: any) {
      console.error("[v0] Error in handleSubmit:", err) // Added debug logging
      setError(err.message || "Salon eklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (salonId: string) => {
    if (
      !confirm(
        "Bu salonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve salona ait tüm ameliyatlar silinecektir.",
      )
    ) {
      return
    }

    try {
      await deleteSalon(salonId)
    } catch (err: any) {
      alert(err.message || "Salon silinirken bir hata oluştu")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ameliyathaneler</CardTitle>
            <CardDescription>Sistemdeki ameliyathane salonlarını görüntüleyin ve yönetin</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Salon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yeni Salon Ekle</DialogTitle>
                  <DialogDescription>Yeni bir ameliyathane salonu ekleyin</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Salon Adı</Label>
                    <Input id="name" name="name" placeholder="Örn: Salon 3" required disabled={isLoading} />
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
              <TableHead>Salon Adı</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salons.map((salon) => (
              <TableRow key={salon.id}>
                <TableCell className="font-medium">{salon.name}</TableCell>
                <TableCell>{new Date(salon.created_at).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(salon.id)}
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

"use client"

import type React from "react"

import { useState } from "react"
import type { Profile } from "@/lib/types"
import { createUser, deleteUser } from "@/lib/actions/admin"
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
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface UserManagementProps {
  users: Profile[]
}

export function UserManagement({ users }: UserManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      is_admin: formData.get("is_admin") === "on",
    }

    try {
      await createUser(data)
      setIsDialogOpen(false)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message || "Kullanıcı oluşturulurken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return
    }

    try {
      await deleteUser(userId)
    } catch (err: any) {
      alert(err.message || "Kullanıcı silinirken bir hata oluştu")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kullanıcılar</CardTitle>
            <CardDescription>Sisteme erişimi olan tüm kullanıcıları görüntüleyin ve yönetin</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Yeni Kullanıcı
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                  <DialogDescription>Sisteme yeni bir kullanıcı eklemek için bilgileri girin</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Kullanıcı Adı</Label>
                    <Input id="username" name="username" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input id="password" name="password" type="password" required disabled={isLoading} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Ad</Label>
                      <Input id="first_name" name="first_name" required disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Soyad</Label>
                      <Input id="last_name" name="last_name" required disabled={isLoading} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="is_admin" name="is_admin" disabled={isLoading} />
                    <Label htmlFor="is_admin" className="font-normal cursor-pointer">
                      Admin yetkisi ver
                    </Label>
                  </div>
                  {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Oluşturuluyor..." : "Oluştur"}
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
              <TableHead>Kullanıcı Adı</TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>
                  {user.is_admin ? <Badge>Admin</Badge> : <Badge variant="outline">Kullanıcı</Badge>}
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
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

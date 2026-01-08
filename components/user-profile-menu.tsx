"use client"

import type React from "react"
import { updateUserPassword } from "@/lib/actions/admin"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, KeyRound, LogOut } from "lucide-react"
import { logout } from "@/lib/actions/auth"
import type { Profile } from "@/lib/types"

interface UserProfileMenuProps {
  user: Profile
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get("new_password") as string
    const confirmPassword = formData.get("confirm_password") as string

    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor")
      setIsLoading(false)
      return
    }

    try {
      await updateUserPassword(user.id, newPassword)
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
      setTimeout(() => {
        setIsPasswordDialogOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Şifre değiştirilirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {user.first_name} {user.last_name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Şifre Değiştir
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <form onSubmit={handlePasswordChange}>
            <DialogHeader>
              <DialogTitle>Şifre Değiştir</DialogTitle>
              <DialogDescription>Yeni şifrenizi girin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Yeni Şifre</Label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="Yeni şifrenizi girin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Şifre Tekrar</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="Şifrenizi tekrar girin"
                />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</div>}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  Şifreniz başarıyla değiştirildi!
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

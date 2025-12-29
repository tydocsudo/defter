import { getCurrentUser, logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Home, BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Surgery Calendar Logo" width={40} height={40} className="object-contain" />
            <span className="hidden md:inline font-semibold text-lg">Ameliyat Planlama</span>
          </Link>
          <div className="h-6 w-px bg-gray-300 mx-2" />
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </Button>
          </Link>
          <Link href="/fliphtml">
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Defter</span>
            </Button>
          </Link>
          <Link href="/waiting-list">
            <Button variant="ghost" size="sm" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Bekleme</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {user?.is_admin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Yönetim</span>
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user?.first_name} {user?.last_name}
                </span>
                {user?.is_admin && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Admin</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full flex items-center gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

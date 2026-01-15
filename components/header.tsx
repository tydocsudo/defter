import { getCurrentUser } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Settings, Home, BookOpen, Clock, CalendarClock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { InstallPWAButton } from "@/components/install-pwa-button"

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="border-b bg-background sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Surgery Calendar Logo" width={40} height={40} className="object-contain" />
            <span className="hidden md:inline font-semibold text-lg">Ameliyat Planlama</span>
          </Link>
          <div className="h-6 w-px bg-border mx-2" />
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
          <Link href="/bulk-operations">
            <Button variant="ghost" size="sm" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Toplu İşlemler</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <InstallPWAButton />
          <ThemeToggle />
          {user?.is_admin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Yönetim</span>
              </Button>
            </Link>
          )}
          {user && <UserProfileMenu user={user} />}
        </div>
      </div>
    </header>
  )
}

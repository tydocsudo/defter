"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setIsInstalled(true)
      }
    } else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // iOS - show instructions
      setShowIOSInstructions(true)
    }
  }

  // Don't show if already installed or not supported
  if (isInstalled) return null

  // Only show on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  if (!isMobile) return null

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Ana Ekrana Ekle</span>
        <span className="sm:hidden">Ekle</span>
      </Button>

      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Ana Ekrana Ekle
              <Button variant="ghost" size="icon" onClick={() => setShowIOSInstructions(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-4">
              <p className="font-semibold">iOS için talimatlar:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Safari tarayıcısının altındaki <strong>Paylaş</strong> düğmesine dokunun (⬆️ ikonu)
                </li>
                <li>
                  Aşağı kaydırın ve <strong>"Ana Ekrana Ekle"</strong> seçeneğini bulun
                </li>
                <li>
                  <strong>"Ekle"</strong> düğmesine dokunun
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">Not: Bu özellik sadece Safari tarayıcısında çalışır.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}

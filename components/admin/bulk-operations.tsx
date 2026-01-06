"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { bulkMoveToWaitingListByMonth } from "@/lib/actions/surgeries"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const months = [
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
]

const currentYear = new Date().getFullYear()
const years = [currentYear - 1, currentYear, currentYear + 1]

export function BulkOperations() {
  const [selectedMonth, setSelectedMonth] = useState<string>("12")
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [isLoading, setIsLoading] = useState(false)

  const handleBulkMove = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Hata",
        description: "Lütfen ay ve yıl seçin",
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear} ayındaki tüm hastaları bekleme listesine taşımak istediğinizden emin misiniz?`,
    )

    if (!confirmed) return

    setIsLoading(true)
    try {
      const result = await bulkMoveToWaitingListByMonth(Number.parseInt(selectedYear), Number.parseInt(selectedMonth))

      toast({
        title: "Başarılı",
        description: `${result.count} hasta bekleme listesine taşındı`,
      })
    } catch (error: any) {
      console.error("Error moving patients:", error)
      toast({
        title: "Hata",
        description: error.message || "Hastalar taşınırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 dark:bg-slate-800">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Toplu İşlemler</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="year" className="dark:text-slate-200">
              Yıl
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Yıl seçin" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)} className="dark:text-white dark:focus:bg-slate-600">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="month" className="dark:text-slate-200">
              Ay
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Ay seçin" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="dark:text-white dark:focus:bg-slate-600">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleBulkMove}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Seçili Aydaki Tüm Hastaları Bekleme Listesine Taşı
          </Button>
        </div>
      </Card>
    </div>
  )
}

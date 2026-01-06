"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Database, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function BackupManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTables, setSelectedTables] = useState({
    salons: true,
    doctors: true,
    surgeries: true,
    surgery_notes: true,
    day_notes: true,
    daily_assigned_doctors: true,
    profiles: false, // Profiles excluded by default for security
  })

  const handleToggleTable = (table: string) => {
    setSelectedTables((prev) => ({
      ...prev,
      [table]: !prev[table as keyof typeof prev],
    }))
  }

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const backupData: Record<string, any> = {}

      // Export selected tables
      for (const [table, isSelected] of Object.entries(selectedTables)) {
        if (isSelected) {
          const { data, error } = await supabase.from(table).select("*")

          if (error) {
            console.error(`[v0] Error fetching ${table}:`, error)
            toast.error(`${table} tablosu yedeklenirken hata oluştu`)
            continue
          }

          // Exclude passwords from profiles if included
          if (table === "profiles" && data) {
            backupData[table] = data.map(({ password, ...rest }) => rest)
          } else {
            backupData[table] = data
          }
        }
      }

      // Create JSON blob
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Download file
      const timestamp = new Date().toISOString().split("T")[0]
      const link = document.createElement("a")
      link.href = url
      link.download = `surgery-backup-${timestamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Yedekleme başarıyla indirildi")
    } catch (error) {
      console.error("[v0] Backup error:", error)
      toast.error("Yedekleme sırasında hata oluştu")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()

      // Export each table as separate CSV
      for (const [table, isSelected] of Object.entries(selectedTables)) {
        if (isSelected) {
          const { data, error } = await supabase.from(table).select("*")

          if (error) {
            console.error(`[v0] Error fetching ${table}:`, error)
            toast.error(`${table} tablosu yedeklenirken hata oluştu`)
            continue
          }

          if (!data || data.length === 0) continue

          // Exclude passwords from profiles if included
          let exportData = data
          if (table === "profiles") {
            exportData = data.map(({ password, ...rest }) => rest)
          }

          // Convert to CSV
          const headers = Object.keys(exportData[0])
          const csvRows = [
            headers.join(","),
            ...exportData.map((row: any) =>
              headers
                .map((header) => {
                  const value = row[header]
                  // Escape quotes and wrap in quotes if contains comma
                  const escaped = String(value ?? "").replace(/"/g, '""')
                  return escaped.includes(",") ? `"${escaped}"` : escaped
                })
                .join(","),
            ),
          ]
          const csvString = csvRows.join("\n")

          // Download CSV
          const blob = new Blob([csvString], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const timestamp = new Date().toISOString().split("T")[0]
          const link = document.createElement("a")
          link.href = url
          link.download = `${table}-backup-${timestamp}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }

      toast.success("CSV yedeklemeleri başarıyla indirildi")
    } catch (error) {
      console.error("[v0] CSV backup error:", error)
      toast.error("CSV yedekleme sırasında hata oluştu")
    } finally {
      setIsExporting(false)
    }
  }

  const tableDescriptions: Record<string, string> = {
    salons: "Salon bilgileri",
    doctors: "Hoca bilgileri",
    surgeries: "Ameliyat kayıtları",
    surgery_notes: "Ameliyat notları",
    day_notes: "Günlük notlar",
    daily_assigned_doctors: "Günlük hoca atamaları",
    profiles: "Kullanıcı profilleri (şifreler hariç)",
  }

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-slate-100">
          <Database className="h-5 w-5" />
          Veritabanı Yedekleme
        </CardTitle>
        <CardDescription className="dark:text-slate-400">
          Sistem verilerinizi JSON veya CSV formatında yedekleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium dark:text-slate-200">Yedeklenecek Tablolar</h3>
          <div className="space-y-2">
            {Object.entries(selectedTables).map(([table, isSelected]) => (
              <div key={table} className="flex items-center space-x-2">
                <Checkbox
                  id={table}
                  checked={isSelected}
                  onCheckedChange={() => handleToggleTable(table)}
                  className="dark:border-slate-600"
                />
                <label
                  htmlFor={table}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-300"
                >
                  {table} - {tableDescriptions[table]}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
          <Button
            onClick={handleExportJSON}
            disabled={isExporting || !Object.values(selectedTables).some((v) => v)}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            JSON Olarak İndir
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={isExporting || !Object.values(selectedTables).some((v) => v)}
            variant="outline"
            className="flex-1 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV Olarak İndir
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Yedekleme Notları</p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Kullanıcı şifreleri güvenlik nedeniyle yedeklemeye dahil edilmez</li>
                <li>JSON formatı tüm tabloları tek dosyada içerir</li>
                <li>CSV formatı her tablo için ayrı dosya oluşturur</li>
                <li>Yedekleme dosyaları tarih damgalı olarak indirilir</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

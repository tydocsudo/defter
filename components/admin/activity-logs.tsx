"use client"

import { useEffect, useState } from "react"
import type { ActivityLog } from "@/lib/types"
import {
  getActivityLogs,
  getActivityLogsCount,
  deleteActivityLogsByDateRange,
  deleteAllActivityLogs,
} from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Trash2, AlertTriangle } from "lucide-react"
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "@/lib/utils/date-formatter"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ActivityLogWithSurgery = ActivityLog & {
  surgery?: {
    patient_name: string
    surgery_date: string | null
    is_waiting_list: boolean
  } | null
  salonName?: string | null
  oldSalonName?: string | null
}

function formatActivityDetails(log: ActivityLogWithSurgery): string {
  try {
    if (!log.details) return "-"

    const details = log.details as any
    const parts: string[] = []

    switch (log.action) {
      case "Hasta Eklendi":
        // Show nothing extra - patient name is already in its own column
        break

      case "Hasta Güncellendi":
        if (details.changes && typeof details.changes === "object") {
          const changesList: string[] = []

          // Map field names to Turkish
          const fieldNames: Record<string, string> = {
            patient_name: "Hasta Adı",
            protocol_number: "Protokol No",
            indication: "Tanı",
            procedure_name: "Operasyon",
            surgery_date: "Ameliyat Tarihi",
            phone_number_1: "Telefon 1",
            phone_number_2: "Telefon 2",
          }

          Object.entries(details.changes).forEach(([key, value]: [string, any]) => {
            try {
              const fieldName = fieldNames[key] || key
              const oldVal = value?.old || "-"
              const newVal = value?.new || "-"

              // Format dates properly
              if (key === "surgery_date") {
                const formattedOld = oldVal !== "-" ? formatDateDDMMYYYY(oldVal) : "-"
                const formattedNew = newVal !== "-" ? formatDateDDMMYYYY(newVal) : "-"
                changesList.push(`${fieldName}: ${formattedOld} → ${formattedNew}`)
              } else {
                changesList.push(`${fieldName}: ${oldVal} → ${newVal}`)
              }
            } catch (err) {
              console.error("[v0] Error formatting change detail:", err)
            }
          })

          parts.push(...changesList)
        }
        break

      case "Hasta Onaylandı":
        parts.push("✓ Onaylandı")
        break

      case "Onay Kaldırıldı":
        parts.push("✗ Onay kaldırıldı")
        break

      case "Bekleme Listesine Alındı":
        if (log.oldSalonName) {
          parts.push(`${log.oldSalonName}'dan kaldırıldı`)
        }
        if (details.old_surgery_date) {
          try {
            parts.push(`Eski tarih: ${formatDateDDMMYYYY(details.old_surgery_date)}`)
          } catch (err) {
            console.error("[v0] Error formatting old surgery date:", err)
          }
        }
        break

      case "Bekleme Listesinden Atandı":
        if (log.salonName) {
          parts.push(`${log.salonName}'e atandı`)
        }
        if (details.surgery_date) {
          try {
            parts.push(`Tarih: ${formatDateDDMMYYYY(details.surgery_date)}`)
          } catch (err) {
            console.error("[v0] Error formatting surgery date:", err)
          }
        }
        break

      default:
        break
    }

    return parts.length > 0 ? parts.join(" | ") : "-"
  } catch (error) {
    console.error("[v0] Error in formatActivityDetails:", error)
    return "-"
  }
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogWithSurgery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isClearing, setIsClearing] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true)
      try {
        console.log("[v0] ActivityLogs: Fetching logs for page", currentPage, "with pageSize", pageSize)
        const offset = (currentPage - 1) * pageSize
        const [data, count] = await Promise.all([getActivityLogs(pageSize, offset), getActivityLogsCount()])
        console.log("[v0] ActivityLogs: Received", data.length, "logs, total count:", count)
        setLogs(data as any)
        setTotalCount(count)
      } catch (error) {
        console.error("[v0] ActivityLogs: Failed to fetch activity logs:", error)
        setLogs([])
        setTotalCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [currentPage, pageSize])

  const handleClearByDateRange = async () => {
    if (!startDate || !endDate) {
      alert("Lütfen başlangıç ve bitiş tarihlerini seçin")
      return
    }

    setIsClearing(true)
    try {
      await deleteActivityLogsByDateRange(startDate, endDate)
      // Refresh logs
      const offset = (currentPage - 1) * pageSize
      const [data, count] = await Promise.all([getActivityLogs(pageSize, offset), getActivityLogsCount()])
      setLogs(data as any)
      setTotalCount(count)
      setClearDialogOpen(false)
      setStartDate("")
      setEndDate("")
    } catch (error) {
      console.error("[v0] Error clearing logs:", error)
      alert("Loglar silinirken hata oluştu")
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearAllLogs = async () => {
    setIsClearing(true)
    try {
      await deleteAllActivityLogs()
      setLogs([])
      setTotalCount(0)
      setCurrentPage(1)
    } catch (error) {
      console.error("[v0] Error clearing all logs:", error)
      alert("Loglar silinirken hata oluştu")
    } finally {
      setIsClearing(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>İşlem Geçmişi</CardTitle>
            <CardDescription>Sistemde yapılan tüm değişiklikleri görüntüleyin</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tarih Aralığı Sil
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tarih Aralığına Göre Logları Sil</DialogTitle>
                  <DialogDescription>
                    Seçtiğiniz tarih aralığındaki tüm loglar kalıcı olarak silinecektir.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Bitiş Tarihi</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearByDateRange}
                    disabled={isClearing || !startDate || !endDate}
                  >
                    {isClearing ? "Siliniyor..." : "Logları Sil"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Tüm Logları Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tüm Logları Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Tüm işlem geçmişi kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllLogs}
                    disabled={isClearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isClearing ? "Siliniyor..." : "Evet, Tümünü Sil"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Henüz bir işlem kaydı yok</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hasta Adı</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Ameliyat Tarihi</TableHead>
                  <TableHead>İşlem Detayı</TableHead>
                  <TableHead>Tarih/Saat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  try {
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.surgery?.patient_name || (log.details as any)?.patient_name || "-"}
                        </TableCell>

                        <TableCell>
                          {log.user ? (
                            <span>
                              {log.user.first_name} {log.user.last_name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Bilinmeyen</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>

                        <TableCell>
                          {log.surgery?.is_waiting_list ? (
                            <Badge variant="secondary">Bekleme Listesinde</Badge>
                          ) : log.surgery?.surgery_date ? (
                            formatDateDDMMYYYY(log.surgery.surgery_date)
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-gray-600">{formatActivityDetails(log)}</TableCell>

                        <TableCell className="text-sm text-gray-500">
                          {formatDateTimeDDMMYYYY(log.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  } catch (error) {
                    console.error("[v0] Error rendering log row:", log.id, error)
                    return (
                      <TableRow key={log.id}>
                        <TableCell colSpan={6} className="text-center text-red-500">
                          Hata: Bu log gösterilemiyor
                        </TableCell>
                      </TableRow>
                    )
                  }
                })}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sayfa başına:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Sayfa {currentPage} / {totalPages} (Toplam {totalCount} kayıt)
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

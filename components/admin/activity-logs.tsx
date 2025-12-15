"use client"

import { useEffect, useState } from "react"
import type { ActivityLog } from "@/lib/types"
import { getActivityLogs } from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getActivityLogs(100)
        setLogs(data as any)
      } catch (error) {
        console.error("Failed to fetch activity logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>İşlem Geçmişi</CardTitle>
        <CardDescription>Sistemde yapılan tüm değişiklikleri görüntüleyin</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Henüz bir işlem kaydı yok</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih/Saat</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead>Detaylar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{new Date(log.created_at).toLocaleString("tr-TR")}</TableCell>
                  <TableCell>
                    {log.user ? (
                      <span className="font-medium">
                        {log.user.first_name} {log.user.last_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Bilinmeyen</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.details && <pre className="text-xs">{JSON.stringify(log.details, null, 2)}</pre>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useGetBatchAttendanceByDateQuery } from "@/redux/slices/attendance/attendanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"

export function AttendanceHistory() {
    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'TEACHER'
    
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    )

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const { data: batchAttendance, isLoading } = useGetBatchAttendanceByDateQuery(
        { batchId: selectedBatchId!, date: selectedDate },
        { skip: !selectedBatchId }
    )

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Batch</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedBatchId || ""}
                        onChange={(e) => setSelectedBatchId(Number(e.target.value) || null)}
                    >
                        <option value="">Select a batch...</option>
                        {batches.map((batch: any) => (
                            <option key={batch.id} value={batch.id}>
                                {batch.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Date</label>
                    <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {!selectedBatchId ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    Select a batch to view attendance history
                </div>
            ) : isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : batchAttendance && batchAttendance.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Marked By</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batchAttendance.map((record: any) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                    {record.student?.fullname || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {record.student?.email || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={record.status === 'PRESENT' ? 'default' : 'destructive'}>
                                        {record.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{record.method}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {record.markedBy || '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    No attendance records found for this date
                </div>
            )}
        </div>
    )
}
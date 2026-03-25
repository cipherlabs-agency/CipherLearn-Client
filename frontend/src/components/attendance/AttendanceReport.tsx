"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FileDown, Loader2, BarChart3, Users, TrendingUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useGetAttendanceReportQuery } from "@/redux/slices/attendance/attendanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { Batch } from "@/types"

const STUDENTS_PER_PAGE = 50

export function AttendanceReport() {
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
    )
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    )
    const [page, setPage] = useState(1)

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const { data: report, isLoading, isFetching } = useGetAttendanceReportQuery(
        { batchId: selectedBatchId!, startDate, endDate, page, limit: STUDENTS_PER_PAGE },
        { skip: !selectedBatchId }
    )

    // Reset to page 1 when filters change
    const handleBatchChange = (v: string) => {
        setSelectedBatchId(Number(v) || null)
        setPage(1)
    }
    const handleStartDateChange = (v: string) => {
        setStartDate(v)
        setPage(1)
    }
    const handleEndDateChange = (v: string) => {
        setEndDate(v)
        setPage(1)
    }

    const handleExportCSV = () => {
        if (!report) return

        const headers = ['Student Name', 'Email', 'Present Days', 'Absent Days', 'Total Days', 'Percentage']
        const rows = report.studentStats.map(s => [
            s.studentName,
            s.email,
            s.presentDays,
            s.absentDays,
            s.totalDays,
            `${s.percentage}%`
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance-report-${report.batchName}-${startDate}-${endDate}.csv`
        a.click()
    }

    const loading = isLoading || isFetching
    const pagination = report?.pagination

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
            {/* ─── Filters ─── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Batch
                    </label>
                    <Select
                        value={String(selectedBatchId || "")}
                        onValueChange={handleBatchChange}
                    >
                        <SelectTrigger className="h-10 text-[13px] font-medium rounded-xl border-border/60">
                            <SelectValue placeholder="Select a batch…" />
                        </SelectTrigger>
                        <SelectContent>
                            {batches.map((batch: Batch) => (
                                <SelectItem key={batch.id} value={String(batch.id)}>
                                    <span className="font-semibold">{batch.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        From
                    </label>
                    <Input
                        type="date"
                        className="h-10 text-[13px] font-medium rounded-xl border-border/60"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        To
                    </label>
                    <Input
                        type="date"
                        className="h-10 text-[13px] font-medium rounded-xl border-border/60"
                        value={endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                </div>
                <div className="flex items-end">
                    <Button
                        onClick={handleExportCSV}
                        disabled={!report || isFetching}
                        variant="outline"
                        className="w-full h-10 rounded-xl text-[12px] font-bold gap-1.5"
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {!selectedBatchId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BarChart3 className="h-7 w-7 text-foreground/15 mb-3" />
                    <h3 className="text-sm font-semibold mb-1">Select a batch</h3>
                    <p className="text-[12.5px] text-muted-foreground max-w-[280px] leading-relaxed">
                        Choose a batch and date range to generate an attendance report.
                    </p>
                </div>
            ) : loading ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-20 rounded-xl bg-muted/15" />
                        ))}
                    </div>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-14 rounded-xl bg-muted/10" />
                    ))}
                </div>
            ) : report ? (
                <>
                    {/* ─── Stat Cards ─── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border/50 bg-muted/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batch</span>
                            </div>
                            <p className="text-lg font-bold tracking-tight">{report.batchName}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-muted/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Students</span>
                            </div>
                            <p className="text-lg font-bold tracking-tight">{report.totalStudents}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-muted/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Period</span>
                            </div>
                            <p className="text-[12px] font-semibold">
                                {new Date(report.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                {" — "}
                                {new Date(report.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-muted/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold tracking-tight ${
                                    report.overallAttendancePercentage >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                                    report.overallAttendancePercentage >= 50 ? "text-amber-600 dark:text-amber-400" :
                                    "text-red-500"
                                }`}>{report.overallAttendancePercentage}%</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Student Rows ─── */}
                    <div className="space-y-1.5">
                        {/* Column header */}
                        <div className="flex items-center justify-between mb-1">
                            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-1">
                                <div className="col-span-4">Student</div>
                                <div className="col-span-2 text-center">Present</div>
                                <div className="col-span-2 text-center">Absent</div>
                                <div className="col-span-1 text-center">Total</div>
                                <div className="col-span-3 text-right">Attendance</div>
                            </div>
                            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2 flex-shrink-0" />}
                        </div>

                        {report.studentStats.map((student) => {
                            const pct = student.percentage
                            const color = pct >= 75 ? "emerald" : pct >= 50 ? "amber" : "red"

                            return (
                                <div
                                    key={student.studentId}
                                    className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl border border-border/40 hover:bg-muted/5 transition-colors"
                                >
                                    <div className="col-span-4 min-w-0">
                                        <p className="text-[13px] font-semibold truncate">{student.studentName}</p>
                                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{student.email}</p>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{student.presentDays}</span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="text-[14px] font-bold text-red-500 tabular-nums">{student.absentDays}</span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">{student.totalDays}</span>
                                    </div>
                                    <div className="col-span-3 flex items-center gap-2 justify-end">
                                        <Progress
                                            value={pct}
                                            className={`w-16 h-1.5 ${
                                                color === "amber" ? "[&>div]:bg-amber-500" :
                                                color === "red" ? "[&>div]:bg-red-500" : ""
                                            }`}
                                        />
                                        <span className={`text-[12px] font-bold tabular-nums min-w-[2.5rem] text-right ${
                                            color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                                            color === "amber" ? "text-amber-600 dark:text-amber-400" :
                                            "text-red-500"
                                        }`}>{pct}%</span>
                                    </div>
                                </div>
                            )
                        })}

                        {/* ─── Pagination ─── */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-3 pb-1 px-1">
                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                    Page {pagination.page} of {pagination.totalPages}
                                    <span className="ml-2 text-muted-foreground/60">
                                        ({(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students)
                                    </span>
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg"
                                        disabled={pagination.page <= 1 || isFetching}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg"
                                        disabled={pagination.page >= pagination.totalPages || isFetching}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BarChart3 className="h-7 w-7 text-foreground/15 mb-3" />
                    <h3 className="text-sm font-semibold mb-1">No data found</h3>
                    <p className="text-[12.5px] text-muted-foreground max-w-[280px] leading-relaxed">
                        No attendance data is available for this batch in the selected date range.
                    </p>
                </div>
            )}
        </div>
    )
}

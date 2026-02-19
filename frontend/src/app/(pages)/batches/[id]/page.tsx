"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-dot"
import {
    ArrowLeft,
    Users,
    Clock,
    Calendar,
    GraduationCap,
    TrendingUp,
    IndianRupee,
    Phone,
    UserCheck,
    AlertCircle,
    CheckCircle2,
} from "lucide-react"
import { useGetBatchByIdQuery } from "@/redux/slices/batches/batchesApi"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { useGetAttendanceReportQuery } from "@/redux/slices/attendance/attendanceApi"
import { useGetFeeReceiptsQuery, useGetReceiptsSummaryQuery } from "@/redux/slices/fees/feesApi"
import type { Student, StudentAttendanceStats, FeeReceipt } from "@/types"
import { useMemo } from "react"

// ─── Helpers ──────────────────────────────────────────────

function formatCurrency(amt: number): string {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amt)
}

function attColor(pct: number) {
    if (pct >= 85) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/20" }
    if (pct >= 60) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/20" }
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500", ring: "ring-red-500/20" }
}

function isTodayClassDay(days: string[]): boolean {
    const todayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = todayNames[new Date().getDay()]
    return days.some(d => d.toLowerCase() === today.toLowerCase())
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.charAt(0).toUpperCase()
}

// ─── Skeleton ─────────────────────────────────────────────

function PageSkeleton() {
    return (
        <div className="py-5 px-6 max-w-[1400px] mx-auto space-y-5">
            <Skeleton className="h-7 w-20 bg-muted/30 rounded" />
            <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-48 bg-muted/30" />
                <Skeleton className="h-5 w-14 rounded-full bg-muted/20" />
            </div>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-lg border border-border bg-card px-4 py-3.5 flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg bg-muted/30" />
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-2.5 w-16 bg-muted/30" />
                            <Skeleton className="h-5 w-12 bg-muted/20" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="px-5 py-3 border-b border-border/30 flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-muted/20" />
                        <Skeleton className="h-3 w-32 bg-muted/20" />
                        <Skeleton className="h-3 w-24 bg-muted/15 ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────

export default function BatchDetailPage() {
    const params = useParams()
    const router = useRouter()
    const batchId = Number(params.id)

    // Data
    const { data: batch, isLoading: batchLoading, isError: batchError } = useGetBatchByIdQuery(batchId)
    const { data: students = [], isLoading: studentsLoading } = useGetStudentsQuery(batchId)

    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: attendanceReport } = useGetAttendanceReportQuery({
        batchId,
        startDate: thirtyDaysAgo.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
    }, { skip: !batchId })

    const { data: feeSummary } = useGetReceiptsSummaryQuery(
        { batchId, academicYear: today.getFullYear() },
        { skip: !batchId }
    )
    const { data: feeData } = useGetFeeReceiptsQuery({ batchId }, { skip: !batchId })
    const feeReceipts: FeeReceipt[] = feeData?.receipts || []

    // Maps
    const attendanceMap = useMemo(() => {
        const m: Record<number, StudentAttendanceStats> = {}
        attendanceReport?.studentStats?.forEach(s => { m[s.studentId] = s })
        return m
    }, [attendanceReport])

    const feeMap = useMemo(() => {
        const m: Record<number, { due: number; paid: number; worst: string }> = {}
        feeReceipts.forEach(r => {
            if (!m[r.studentId]) m[r.studentId] = { due: 0, paid: 0, worst: "PAID" }
            const s = m[r.studentId]
            s.due += r.totalAmount; s.paid += r.paidAmount
            if (r.status === "OVERDUE") s.worst = "OVERDUE"
            else if (r.status === "PENDING" && s.worst !== "OVERDUE") s.worst = "PENDING"
            else if (r.status === "PARTIAL" && !["OVERDUE", "PENDING"].includes(s.worst)) s.worst = "PARTIAL"
        })
        return m
    }, [feeReceipts])

    const avgAtt = useMemo(() => {
        const stats = attendanceReport?.studentStats
        if (!stats?.length) return null
        return Math.round(stats.reduce((a, s) => a + s.percentage, 0) / stats.length)
    }, [attendanceReport])

    const isLoading = batchLoading || studentsLoading
    if (isLoading) return <PageSkeleton />

    if (batchError || !batch) {
        return (
            <div className="py-5 px-6 max-w-[1400px] mx-auto">
                <button onClick={() => router.push("/batches")} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5">
                    <ArrowLeft className="h-3.5 w-3.5" /> Batches
                </button>
                <Card className="flex flex-col items-center justify-center py-16 border-dashed border-destructive/30 bg-destructive/5 text-center">
                    <AlertCircle className="h-5 w-5 text-destructive mb-2" />
                    <h3 className="font-semibold text-destructive text-sm mb-1">Batch Not Found</h3>
                    <p className="text-[13px] text-muted-foreground max-w-[260px] mb-4">This batch may have been deleted or the link is incorrect.</p>
                    <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => router.push("/batches")}>Go to Batches</Button>
                </Card>
            </div>
        )
    }

    const enrolled = typeof batch.totalStudents === "object" ? batch.totalStudents?.enrolled ?? 0 : 0
    const capacity = typeof batch.totalStudents === "object" ? batch.totalStudents?.capacity ?? 0 : Number(batch.totalStudents) ?? 0
    const totalStudents = students.length
    const classToday = isTodayClassDay(batch.timings.days)
    const collectionRate = feeSummary?.totalAmount ? Math.round((feeSummary.paidAmount / feeSummary.totalAmount) * 100) : null

    return (
        <div className="py-5 px-6 max-w-[1400px] mx-auto animate-fade-in">
            {/* Breadcrumb */}
            <button
                onClick={() => router.push("/batches")}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Batches
            </button>

            {/* ─── Header ─── */}
            <div className="flex items-start justify-between pb-5 border-b border-border/40">
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold tracking-tight text-foreground">{batch.name}</h1>
                        <Badge variant="outline" className={`text-[11px] px-2 py-0 h-5 font-semibold border-0 ${batch.isDeleted ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                            {batch.isDeleted ? "Archived" : "Active"}
                        </Badge>
                        {classToday && (
                            <Badge variant="outline" className="text-[11px] px-2 py-0 h-5 font-semibold border-0 bg-primary/10 text-primary animate-pulse">
                                Class Today
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[12.5px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 opacity-60" />{batch.timings.time || "—"}</span>
                        <span className="opacity-20">·</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3 opacity-60" />{batch.timings.days.length > 0 ? batch.timings.days.map(d => d.slice(0, 3)).join(", ") : "—"}</span>
                        <span className="opacity-20">·</span>
                        <span>Batch #{batch.id}</span>
                    </div>
                </div>
            </div>

            {/* ─── Stats ─── */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mt-5">
                {/* Students */}
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500/8 p-2"><Users className="h-4 w-4 text-blue-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Students</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{totalStudents}</p>
                            <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-none">{enrolled} of {capacity} capacity</p>
                        </div>
                    </div>
                </div>

                {/* Attendance */}
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${avgAtt !== null ? (avgAtt >= 85 ? "bg-emerald-500/8" : avgAtt >= 60 ? "bg-amber-500/8" : "bg-red-500/8") : "bg-muted/60"}`}>
                            <UserCheck className={`h-4 w-4 ${avgAtt !== null ? (avgAtt >= 85 ? "text-emerald-500" : avgAtt >= 60 ? "text-amber-500" : "text-red-500") : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Avg. Attendance</p>
                            <p className={`text-lg font-bold tracking-tight leading-none ${avgAtt !== null ? attColor(avgAtt).text : "text-muted-foreground"}`}>
                                {avgAtt !== null ? `${avgAtt}%` : "—"}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-none">{avgAtt !== null ? "Last 30 days" : "No data yet"}</p>
                        </div>
                    </div>
                </div>

                {/* Fees */}
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${feeSummary?.paidAmount ? "bg-emerald-500/8" : "bg-muted/60"}`}>
                            <IndianRupee className={`h-4 w-4 ${feeSummary?.paidAmount ? "text-emerald-500" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Fees Collected</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">
                                {feeSummary?.paidAmount ? formatCurrency(feeSummary.paidAmount) : "—"}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-none">
                                {collectionRate !== null ? `${collectionRate}% collected` : "No records"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall Rate */}
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-500/8 p-2"><TrendingUp className="h-4 w-4 text-violet-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Batch Rate</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">
                                {attendanceReport?.overallAttendancePercentage != null ? `${Math.round(attendanceReport.overallAttendancePercentage)}%` : "—"}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-none">Overall attendance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Roster ─── */}
            <div className="mt-6">
                <div className="flex items-baseline gap-2 mb-3">
                    <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Students</h2>
                    <span className="text-[12px] text-muted-foreground/60 font-medium">{totalStudents}</span>
                </div>

                <Card className="!p-0 overflow-hidden border-border/60">
                    {students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                            <GraduationCap className="h-6 w-6 text-foreground/25 mb-2.5" />
                            <h3 className="text-[13px] font-semibold mb-0.5">No Students Yet</h3>
                            <p className="text-[12px] text-muted-foreground max-w-[260px] mb-4">Enroll students from the Students page to see them here.</p>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] px-3" onClick={() => router.push("/students")}>Go to Students</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/50 bg-muted/20">
                                    <TableHead className="text-[11px] font-semibold py-2 pl-5 text-muted-foreground/80 uppercase tracking-wider w-[200px]">Student</TableHead>
                                    <TableHead className="text-[11px] font-semibold py-2 text-muted-foreground/80 uppercase tracking-wider w-[130px]">Phone</TableHead>
                                    <TableHead className="text-[11px] font-semibold py-2 text-muted-foreground/80 uppercase tracking-wider w-[80px]">Grade</TableHead>
                                    <TableHead className="text-[11px] font-semibold py-2 text-muted-foreground/80 uppercase tracking-wider w-[170px]">Attendance</TableHead>
                                    <TableHead className="text-[11px] font-semibold py-2 text-muted-foreground/80 uppercase tracking-wider w-[110px]">Fees</TableHead>
                                    <TableHead className="text-[11px] font-semibold py-2 text-muted-foreground/80 uppercase tracking-wider text-right pr-5 w-[80px]">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student: Student, idx: number) => {
                                    const att = attendanceMap[student.id]
                                    const fee = feeMap[student.id]
                                    const ac = att ? attColor(att.percentage) : null

                                    return (
                                        <TableRow
                                            key={student.id}
                                            className="group border-border/25 hover:bg-muted/8 transition-colors"
                                        >
                                            {/* Student */}
                                            <TableCell className="py-2.5 pl-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
                                                        {getInitials(student.fullname)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-[13px] text-foreground leading-tight truncate">{student.fullname}</p>
                                                        {student.parentName && (
                                                            <p className="text-[10.5px] text-muted-foreground/60 leading-tight truncate mt-px">c/o {student.parentName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Phone */}
                                            <TableCell className="py-2.5">
                                                {student.phone ? (
                                                    <span className="text-[12.5px] text-foreground/75 font-medium flex items-center gap-1.5 tabular-nums">
                                                        <Phone className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                                        {student.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-muted-foreground/40">—</span>
                                                )}
                                            </TableCell>

                                            {/* Grade */}
                                            <TableCell className="py-2.5">
                                                {student.grade ? (
                                                    <span className="inline-flex items-center text-[11px] font-semibold text-foreground/70 bg-muted/50 rounded px-1.5 py-0.5 border border-border/30">
                                                        {student.grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-muted-foreground/40">—</span>
                                                )}
                                            </TableCell>

                                            {/* Attendance */}
                                            <TableCell className="py-2.5">
                                                {att ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-14 h-[5px] bg-muted rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${ac!.bg}`} style={{ width: `${Math.min(att.percentage, 100)}%` }} />
                                                        </div>
                                                        <span className={`text-[12px] font-bold tabular-nums min-w-[32px] ${ac!.text}`}>{Math.round(att.percentage)}%</span>
                                                        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{att.presentDays}/{att.totalDays}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] text-muted-foreground/40">—</span>
                                                )}
                                            </TableCell>

                                            {/* Fees */}
                                            <TableCell className="py-2.5">
                                                {fee ? (
                                                    <div>
                                                        <StatusBadge
                                                            variant={fee.worst === "PAID" ? "paid" : fee.worst === "PARTIAL" ? "partial" : fee.worst === "OVERDUE" ? "overdue" : "pending"}
                                                            pulse={fee.worst === "OVERDUE"}
                                                            className="text-[10.5px]"
                                                        >
                                                            {fee.worst === "PAID" ? "Paid" : fee.worst === "PARTIAL" ? "Partial" : fee.worst === "OVERDUE" ? "Overdue" : "Pending"}
                                                        </StatusBadge>
                                                        {fee.worst !== "PAID" && fee.due > 0 && (
                                                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">{formatCurrency(fee.paid)}/{formatCurrency(fee.due)}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-muted-foreground/30" />
                                                        <span className="text-[11px] text-muted-foreground/40">No dues</span>
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Joined */}
                                            <TableCell className="py-2.5 text-right pr-5">
                                                <span className="text-[11.5px] text-muted-foreground/60 tabular-nums">
                                                    {new Date(student.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pb-2">
                <p className="text-[10.5px] text-muted-foreground/50">
                    {students.length} student{students.length !== 1 ? "s" : ""} · Attendance from last 30 days · Fees for {today.getFullYear()}
                </p>
            </div>
        </div>
    )
}

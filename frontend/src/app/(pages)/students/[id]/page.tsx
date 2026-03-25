"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    ArrowLeft,
    GraduationCap,
    Phone,
    Mail,
    MapPin,
    UserCheck,
    IndianRupee,
    AlertCircle,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Cake,
    Users,
    Clock,
    Award,
    TrendingUp,
    BookOpen,
    Target,
    Star,
    Sparkles,
    Check,
    X,
    Timer,
} from "lucide-react"
import { useGetStudentByIdQuery, useDeleteStudentMutation } from "@/redux/slices/students/studentsApi"
import { useGetBatchByIdQuery } from "@/redux/slices/batches/batchesApi"
import { useGetStudentAttendanceMatrixQuery, useGetStudentAttendanceHistoryQuery } from "@/redux/slices/attendance/attendanceApi"
import { useGetStudentFeesSummaryQuery, useGetFeeReceiptsQuery } from "@/redux/slices/fees/feesApi"
import { useGetTestsQuery, useGetTestScoresQuery } from "@/redux/slices/tests/testsApi"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { FeeReceipt, AttendanceRecord, Test, TestScore } from "@/types"

// ─── Helpers ──────────────────────────────────────────────

function formatCurrency(amt: number): string {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amt)
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.charAt(0).toUpperCase()
}

function attColor(pct: number) {
    if (pct >= 85) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", bgLight: "bg-emerald-500/8" }
    if (pct >= 60) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", bgLight: "bg-amber-500/8" }
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500", bgLight: "bg-red-500/8" }
}

function scoreColor(pct: number) {
    if (pct >= 80) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/20" }
    if (pct >= 60) return { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", ring: "ring-blue-500/20" }
    if (pct >= 40) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/20" }
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500", ring: "ring-red-500/20" }
}

function feeStatusVariant(status: string) {
    switch (status) { case "PAID": return "paid" as const; case "PARTIAL": return "partial" as const; case "OVERDUE": return "overdue" as const; default: return "pending" as const; }
}
function feeStatusLabel(status: string) {
    switch (status) { case "PAID": return "Paid"; case "PARTIAL": return "Partial"; case "OVERDUE": return "Overdue"; default: return "Pending"; }
}

function testTypeLabel(type: string) {
    switch (type) { case "UNIT_TEST": return "Unit Test"; case "MIDTERM": return "Midterm"; case "FINAL": return "Final"; case "QUIZ": return "Quiz"; case "PRACTICE": return "Practice"; default: return type; }
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Attendance Calendar ──────────────────────────────────

function AttendanceCalendar({ studentId }: { studentId: number }) {
    const today = new Date()
    const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
    const [calYear, setCalYear] = useState(today.getFullYear())

    const { data: matrix, isLoading } = useGetStudentAttendanceMatrixQuery({
        studentId, month: calMonth, year: calYear,
    })

    // Backend returns: { month: { month, days: [{ day, date, attendance: { status } | null }] }, year }
    // Normalize to a simple day→status map
    const statusMap = useMemo(() => {
        const m: Record<number, string | null> = {}
        // Handle actual backend shape: matrix.month.days[].attendance?.status
        const rawDays = (matrix as any)?.month?.days || (matrix as any)?.days || []
        rawDays.forEach((d: any) => {
            const dayNum = d.day ?? new Date(d.date).getDate()
            const st = d.attendance?.status ?? d.status ?? null
            m[dayNum] = st
        })
        return m
    }, [matrix])

    const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    const isCurrentMonth = calMonth === today.getMonth() + 1 && calYear === today.getFullYear()

    const goPrev = () => { if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
    const goNext = () => { if (isCurrentMonth) return; if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

    // Count using statusMap (already normalized)
    const vals = Object.values(statusMap)
    const presentCount = vals.filter(s => s === "PRESENT" || s === "LATE").length
    const absentCount = vals.filter(s => s === "ABSENT").length
    const totalRecorded = vals.filter(s => s !== null).length
    const percentage = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : null

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Attendance Calendar</h3>
                    {percentage !== null && (
                        <div className="flex items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"><Check className="h-3 w-3" strokeWidth={2.5} /> Present: {presentCount}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium"><Timer className="h-3 w-3" strokeWidth={2} /> Late</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium"><X className="h-3 w-3" strokeWidth={2.5} /> Absent: {absentCount}</span>
                            <span className="opacity-20">·</span>
                            <span className={`text-[11px] font-bold ${attColor(percentage).text}`}>{percentage}%</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted/40" onClick={goPrev}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                    <span className="text-[12px] font-semibold text-foreground min-w-[100px] text-center tabular-nums">{MONTH_SHORT[calMonth - 1]} {calYear}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted/40" onClick={goNext} disabled={isCurrentMonth}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg bg-muted/20" />)}</div>
            ) : (
                <>
                    <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                        {DAY_LABELS.map(d => <div key={d} className="text-[10px] text-center text-muted-foreground font-semibold uppercase py-1 select-none">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="h-10" />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const status = statusMap[day]
                            const isToday = day === today.getDate() && isCurrentMonth

                            let cellCls = "h-10 rounded-lg flex flex-col items-center justify-center gap-0 transition-all duration-200 relative group cursor-default "
                            if (status === "PRESENT") cellCls += "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                            else if (status === "LATE") cellCls += "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                            else if (status === "ABSENT") cellCls += "bg-red-500/12 text-red-500 hover:bg-red-500/20"
                            else cellCls += "bg-muted/20 text-muted-foreground/75 hover:bg-muted/30"
                            if (isToday) cellCls += " ring-2 ring-primary/30 ring-offset-1 ring-offset-background"

                            return (
                                <div key={day} className={cellCls}>
                                    <span className="text-[10.5px] font-bold leading-none">{day}</span>
                                    {status === "PRESENT" && <Check className="h-2.5 w-2.5 mt-0.5" strokeWidth={3} />}
                                    {status === "LATE" && <Timer className="h-2.5 w-2.5 mt-0.5" strokeWidth={2.5} />}
                                    {status === "ABSENT" && <X className="h-2.5 w-2.5 mt-0.5" strokeWidth={3} />}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Score Ring ────────────────────────────────────────────

function ScoreRing({ percentage, size = 52, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference
    const c = scoreColor(percentage)

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className={c.text} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </svg>
            <span className={`absolute text-[11px] font-bold ${c.text} tabular-nums`}>{Math.round(percentage)}%</span>
        </div>
    )
}

// ─── Sparkline ────────────────────────────────────────────

function Sparkline({ data, color = "text-primary", height = 32 }: { data: number[]; color?: string; height?: number }) {
    if (data.length < 2) return null
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const w = 120
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ")

    return (
        <svg width={w} height={height} className={`${color} opacity-60`} viewBox={`0 0 ${w} ${height}`}>
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ─── Page Skeleton ────────────────────────────────────────

function PageSkeleton() {
    return (
        <div className="py-5 px-6 max-w-[1400px] mx-auto space-y-5 animate-pulse">
            <Skeleton className="h-5 w-16 bg-muted/30 rounded" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full bg-muted/30" />
                <div className="space-y-2 flex-1"><Skeleton className="h-6 w-48 bg-muted/30" /><Skeleton className="h-4 w-72 bg-muted/20" /></div>
            </div>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">{[1, 2, 3, 4, 5].map(i => <div key={i} className="rounded-xl border border-border bg-card px-4 py-4 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl bg-muted/30" /><div className="space-y-1.5 flex-1"><Skeleton className="h-2.5 w-14 bg-muted/30" /><Skeleton className="h-5 w-10 bg-muted/20" /></div></div>)}</div>
            <Skeleton className="h-10 w-80 bg-muted/20 rounded-xl mt-4" />
            <div className="rounded-xl border border-border overflow-hidden">{[1, 2, 3, 4, 5].map(i => <div key={i} className="px-5 py-3.5 border-b border-border/30 flex items-center gap-3"><Skeleton className="h-3 w-32 bg-muted/20" /><Skeleton className="h-3 w-24 bg-muted/15 ml-auto" /></div>)}</div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────

export default function StudentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const studentId = Number(params.id)
    const [deleteOpen, setDeleteOpen] = useState(false)

    // Core data
    const { data: student, isLoading: studentLoading, isError } = useGetStudentByIdQuery(studentId)
    const { data: batch } = useGetBatchByIdQuery(student?.batchId ?? 0, { skip: !student?.batchId })

    // Attendance
    const { data: attendanceHistory } = useGetStudentAttendanceHistoryQuery({ studentId, limit: 30 }, { skip: !studentId })

    // Fees
    const { data: feesSummary } = useGetStudentFeesSummaryQuery(studentId, { skip: !studentId })
    const { data: feeData } = useGetFeeReceiptsQuery({ studentId }, { skip: !studentId })
    const feeReceipts: FeeReceipt[] = feeData?.receipts || []

    // Tests — fetch all tests for this student's batch
    const { data: testsData } = useGetTestsQuery(
        student?.batchId ? { batchId: student.batchId, limit: 50 } : undefined,
        { skip: !student?.batchId }
    )
    const allTests: Test[] = testsData?.tests || []

    // We need scores for each test — use getTestById for published/completed ones
    // For now, we fetch the list and show what we have
    const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation()

    // Att stats
    const attStats = useMemo(() => {
        if (!attendanceHistory || attendanceHistory.length === 0) return null
        const present = attendanceHistory.filter((r: AttendanceRecord) => r.status === "PRESENT" || r.status === "LATE").length
        const total = attendanceHistory.length
        return { present, absent: total - present, total, percentage: Math.round((present / total) * 100) }
    }, [attendanceHistory])

    // Test stats for this student
    const completedTests = allTests.filter(t => t.status === "COMPLETED" || t.status === "PUBLISHED")

    const handleDelete = async () => {
        try {
            await deleteStudent(studentId).unwrap()
            toast.success(`${student?.fullname} has been removed.`)
            router.push("/students")
        } catch (error: any) {
            toast.error(error?.data?.message || "Couldn't remove this student. Please try again.")
        }
    }

    if (studentLoading) return <PageSkeleton />

    if (isError || !student) {
        return (
            <div className="py-5 px-6 max-w-[1400px] mx-auto">
                <button onClick={() => router.push("/students")} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5"><ArrowLeft className="h-3.5 w-3.5" /> Students</button>
                <Card className="flex flex-col items-center justify-center py-16 border-dashed border-destructive/30 bg-destructive/5 text-center">
                    <AlertCircle className="h-5 w-5 text-destructive mb-2" />
                    <h3 className="font-semibold text-destructive text-sm mb-1">Student Not Found</h3>
                    <p className="text-[13px] text-muted-foreground max-w-[260px] mb-4">This student may have been removed or the link is incorrect.</p>
                    <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => router.push("/students")}>Go to Students</Button>
                </Card>
            </div>
        )
    }

    const ac = attStats ? attColor(attStats.percentage) : null

    return (
        <div className="py-5 px-6 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Breadcrumb */}
            <button onClick={() => router.push("/students")} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1 group">
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Students
            </button>

            {/* ─── Profile Header ─── */}
            <div className="flex items-start justify-between pb-6 border-b border-border/30">
                <div className="flex items-center gap-5">
                    {/* Avatar — larger, with gradient ring */}
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/15 flex items-center justify-center text-primary text-2xl font-bold shadow-lg shadow-primary/5">
                            {getInitials(student.fullname)}
                        </div>
                        {/* Status dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">{student.fullname}</h1>
                            {batch && (
                                <Badge variant="outline" className="text-[10.5px] px-2.5 py-0.5 h-5 font-semibold border-0 bg-primary/8 text-primary rounded-md">
                                    {batch.name}
                                </Badge>
                            )}
                            {student.grade && (
                                <Badge variant="outline" className="text-[10.5px] px-2.5 py-0.5 h-5 font-semibold border-0 bg-violet-500/8 text-violet-500 rounded-md">
                                    {student.grade}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground flex-wrap">
                            <a href={`mailto:${student.email}`} className="flex items-center gap-1 hover:text-primary transition-colors"><Mail className="h-3 w-3 opacity-50" />{student.email}</a>
                            {student.phone && (
                                <><span className="opacity-20">·</span><a href={`tel:${student.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors"><Phone className="h-3 w-3 opacity-50" />{student.phone}</a></>
                            )}
                            <span className="opacity-20">·</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 opacity-50" />Joined {new Date(student.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px] font-semibold border-destructive/20 text-destructive/80 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/40 transition-all" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
            </div>

            {/* ─── 5 Stat Cards ─── */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mt-5">
                {/* Attendance */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:border-foreground/8 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2.5 ${ac ? ac.bgLight : "bg-muted/40"}`}>
                            <UserCheck className={`h-4 w-4 ${ac ? (attStats!.percentage >= 85 ? "text-emerald-500" : attStats!.percentage >= 60 ? "text-amber-500" : "text-red-500") : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className="text-[10.5px] text-muted-foreground font-medium leading-none mb-1.5 uppercase tracking-wider">Attendance</p>
                            <p className={`text-lg font-bold tracking-tight leading-none ${ac ? ac.text : "text-muted-foreground"}`}>{attStats ? `${attStats.percentage}%` : "—"}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-none">{attStats ? `${attStats.present}/${attStats.total} days (30d)` : "No data"}</p>
                        </div>
                    </div>
                </div>

                {/* Fees */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:border-foreground/8 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2.5 ${feesSummary?.totalPaid ? "bg-emerald-500/8" : "bg-muted/40"}`}>
                            <IndianRupee className={`h-4 w-4 ${feesSummary?.totalPaid ? "text-emerald-500" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className="text-[10.5px] text-muted-foreground font-medium leading-none mb-1.5 uppercase tracking-wider">Fees Paid</p>
                            <p className="text-lg font-extrabold tracking-tight leading-none text-foreground">{feesSummary?.totalPaid ? formatCurrency(feesSummary.totalPaid) : "—"}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-none">{feesSummary?.totalPending ? <><span className="text-amber-500 font-bold">{formatCurrency(feesSummary.totalPending)}</span> pending</> : "No dues"}</p>
                        </div>
                    </div>
                </div>

                {/* Tests Taken */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:border-foreground/8 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/8 p-2.5"><BookOpen className="h-4 w-4 text-blue-500" /></div>
                        <div>
                            <p className="text-[10.5px] text-muted-foreground font-medium leading-none mb-1.5 uppercase tracking-wider">Tests</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{completedTests.length}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-none">{completedTests.length === 1 ? "test" : "tests"} completed</p>
                        </div>
                    </div>
                </div>

                {/* Grade */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:border-foreground/8 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-violet-500/8 p-2.5"><GraduationCap className="h-4 w-4 text-violet-500" /></div>
                        <div>
                            <p className="text-[10.5px] text-muted-foreground font-medium leading-none mb-1.5 uppercase tracking-wider">Class</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{student.grade || "—"}</p>
                        </div>
                    </div>
                </div>

                {/* Batch */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:border-foreground/8 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-500/8 p-2.5"><Users className="h-4 w-4 text-amber-500" /></div>
                        <div>
                            <p className="text-[10.5px] text-muted-foreground font-medium leading-none mb-1.5 uppercase tracking-wider">Batch</p>
                            <p className="text-sm font-bold tracking-tight leading-none text-foreground truncate max-w-[100px]">{batch?.name || "—"}</p>
                            {batch?.timings && <p className="text-[10px] text-muted-foreground mt-1 leading-none truncate">{batch.timings.days.map(d => d.slice(0, 3)).join(", ")}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Tabs ─── */}
            <Tabs defaultValue="overview" className="mt-7">
                <TabsList className="bg-muted/15 border border-border/30 p-1 h-10 rounded-xl gap-0.5">
                    <TabsTrigger value="overview" className="text-[12px] font-semibold h-7 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="tests" className="text-[12px] font-semibold h-7 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                        Tests & Scores
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="text-[12px] font-semibold h-7 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Attendance</TabsTrigger>
                    <TabsTrigger value="fees" className="text-[12px] font-semibold h-7 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Fees</TabsTrigger>
                </TabsList>

                {/* ─── Overview ─── */}
                <TabsContent value="overview" className="mt-5 space-y-5">
                    {/* Personal Info */}
                    <Card className="p-5 border-border/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-4 w-4 text-primary/60" />
                            <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Personal Details</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            {[
                                { label: "Full Name", value: student.fullname },
                                { label: "Email", value: student.email, href: `mailto:${student.email}`, icon: <Mail className="h-3 w-3 text-muted-foreground/70" /> },
                                student.phone ? { label: "Phone", value: student.phone, href: `tel:${student.phone}`, icon: <Phone className="h-3 w-3 text-muted-foreground/70" /> } : null,
                                student.parentName ? { label: "Parent / Guardian", value: student.parentName } : null,
                                student.dob ? { label: "Date of Birth", value: new Date(student.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <Cake className="h-3 w-3 text-muted-foreground/70" /> } : null,
                                student.address ? { label: "Address", value: student.address, icon: <MapPin className="h-3 w-3 text-muted-foreground/70 mt-0.5" /> } : null,
                                { label: "Grade / Class", value: student.grade || "—" },
                                { label: "Batch", value: batch?.name || `#${student.batchId}` },
                                { label: "Enrolled", value: new Date(student.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <Clock className="h-3 w-3 text-muted-foreground/70" /> },
                            ].filter(Boolean).map((item, i) => (
                                <div key={i} className="space-y-0.5">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">{item!.label}</p>
                                    {item!.href ? (
                                        <a href={item!.href} className="text-[13px] font-medium text-foreground flex items-center gap-1.5 hover:text-primary transition-colors">
                                            {item!.icon}{item!.value}
                                        </a>
                                    ) : (
                                        <p className="text-[13px] font-medium text-foreground flex items-start gap-1.5">{item!.icon}{item!.value}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Attendance Calendar */}
                    <Card className="p-5 border-border/50 rounded-xl">
                        <AttendanceCalendar studentId={studentId} />
                    </Card>

                    {/* Recent Tests — quick glimpse */}
                    {completedTests.length > 0 && (
                        <Card className="p-5 border-border/50 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-blue-500/60" />
                                    <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Recent Tests</h3>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium">Last {Math.min(completedTests.length, 5)} tests</span>
                            </div>
                            <div className="space-y-2">
                                {completedTests.slice(0, 5).map((test: Test) => (
                                    <TestScoreRow key={test.id} test={test} studentId={studentId} compact />
                                ))}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* ─── Tests & Scores ─── */}
                <TabsContent value="tests" className="mt-5 space-y-5">
                    {completedTests.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/50 text-center rounded-xl">
                            <BookOpen className="h-7 w-7 text-foreground/15 mb-3" />
                            <h3 className="text-sm font-semibold mb-1">No tests yet</h3>
                            <p className="text-[12.5px] text-muted-foreground max-w-[280px] leading-relaxed">
                                Once tests are completed for this student&apos;s batch, scores will appear here.
                            </p>
                        </Card>
                    ) : (
                        <Card className="!p-0 overflow-hidden border-border/50 rounded-xl">
                            <div className="px-5 py-3.5 border-b border-border/30 bg-gradient-to-r from-muted/8 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-blue-500" />
                                        <h3 className="text-[13px] font-semibold text-foreground">All Test Scores</h3>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground font-medium">{completedTests.length} test{completedTests.length !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                            <div className="divide-y divide-border/20">
                                {completedTests.map((test: Test) => (
                                    <TestScoreRow key={test.id} test={test} studentId={studentId} />
                                ))}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* ─── Attendance ─── */}
                <TabsContent value="attendance" className="mt-5 space-y-5">
                    <Card className="p-5 border-border/50 rounded-xl">
                        <AttendanceCalendar studentId={studentId} />
                    </Card>

                    <Card className="!p-0 overflow-hidden border-border/50 rounded-xl">
                        <div className="px-5 py-3.5 border-b border-border/30 bg-gradient-to-r from-muted/8 to-transparent">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                                <h3 className="text-[13px] font-semibold text-foreground">Recent Attendance</h3>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Last 30 records</p>
                        </div>
                        {!attendanceHistory || attendanceHistory.length === 0 ? (
                            <div className="py-12 text-center"><p className="text-[13px] text-muted-foreground">No attendance records yet.</p></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/30 bg-muted/10">
                                        <TableHead className="text-[10px] font-semibold py-2.5 pl-5 text-muted-foreground uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider text-right pr-5">Day</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceHistory.map((record: AttendanceRecord, i: number) => {
                                        const d = new Date(record.date)
                                        return (
                                            <TableRow key={record.id || i} className="border-border/15 hover:bg-muted/5 transition-colors">
                                                <TableCell className="py-2.5 pl-5 text-[12.5px] font-medium tabular-nums">{d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                                                <TableCell className="py-2.5">
                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${record.status === "PRESENT" ? "text-emerald-600 dark:text-emerald-400" : record.status === "LATE" ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${record.status === "PRESENT" ? "bg-emerald-500" : record.status === "LATE" ? "bg-amber-500" : "bg-red-500"}`} />
                                                        {record.status === "PRESENT" ? "Present" : record.status === "LATE" ? "Late" : "Absent"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2.5 text-right pr-5 text-[11.5px] text-muted-foreground">{d.toLocaleDateString("en-IN", { weekday: "short" })}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>

                {/* ─── Fees ─── */}
                <TabsContent value="fees" className="mt-5 space-y-5">
                    {feesSummary && (
                        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: "Total Due", value: formatCurrency(feesSummary.totalDue), color: "text-foreground" },
                                { label: "Paid", value: formatCurrency(feesSummary.totalPaid), color: "text-emerald-600 dark:text-emerald-400" },
                                { label: "Pending", value: formatCurrency(feesSummary.totalPending), color: "text-amber-600 dark:text-amber-400" },
                                { label: "Overdue", value: `${feesSummary.overdueReceipts} receipt${feesSummary.overdueReceipts !== 1 ? "s" : ""}`, color: "text-red-500" },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border border-border/50 bg-card px-4 py-3 hover:border-foreground/8 hover:shadow-sm transition-all">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1.5">{item.label}</p>
                                    <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <Card className="!p-0 overflow-hidden border-border/50 rounded-xl">
                        <div className="px-5 py-3.5 border-b border-border/30 bg-gradient-to-r from-muted/8 to-transparent">
                            <div className="flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 text-emerald-500" />
                                <h3 className="text-[13px] font-semibold text-foreground">Fee Receipts</h3>
                            </div>
                        </div>
                        {feeReceipts.length === 0 ? (
                            <div className="py-12 text-center">
                                <IndianRupee className="h-6 w-6 text-foreground/10 mx-auto mb-2" />
                                <p className="text-[13px] text-muted-foreground">No fee records yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/30 bg-muted/10">
                                        <TableHead className="text-[10px] font-semibold py-2.5 pl-5 text-muted-foreground uppercase tracking-wider">Receipt #</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider">Month</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider">Amount</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider">Paid</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="text-[10px] font-semibold py-2.5 text-muted-foreground uppercase tracking-wider text-right pr-5">Due Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feeReceipts.map((receipt: FeeReceipt) => (
                                        <TableRow key={receipt.id} className="border-border/15 hover:bg-muted/5 transition-colors">
                                            <TableCell className="py-2.5 pl-5"><span className="text-[12px] font-semibold text-foreground tabular-nums">{receipt.receiptNumber}</span></TableCell>
                                            <TableCell className="py-2.5"><span className="text-[12px] text-muted-foreground font-medium">{MONTH_SHORT[(receipt.academicMonth || 1) - 1]} {receipt.academicYear}</span></TableCell>
                                            <TableCell className="py-2.5"><span className="text-[12.5px] font-bold text-foreground tabular-nums">{formatCurrency(receipt.totalAmount)}</span></TableCell>
                                            <TableCell className="py-2.5"><span className="text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(receipt.paidAmount)}</span></TableCell>
                                            <TableCell className="py-2.5">
                                                <StatusBadge variant={feeStatusVariant(receipt.status)} pulse={receipt.status === "OVERDUE"} className="text-[10.5px] font-bold">{feeStatusLabel(receipt.status)}</StatusBadge>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right pr-5"><span className="text-[11.5px] text-muted-foreground tabular-nums">{new Date(receipt.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-4 pb-3">
                <p className="text-[10px] text-muted-foreground/70 font-medium">Student #{student.id} · Attendance from last 30 records · Fees for current year</p>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {student.fullname}?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove them from their batch. Their data can be restored later from Settings if needed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Removing...</> : "Remove Student"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// ─── Test Score Row (fetches individual test) ─────────────

function TestScoreRow({ test, studentId, compact }: { test: Test; studentId: number; compact?: boolean }) {
    // Fetch all scores for this test (coaching class batches are small, limit=200 covers all students)
    const { data: scoresData } = useGetTestScoresQuery({ id: test.id, page: 1, limit: 200 })
    const score = scoresData?.scores?.find((s: TestScore) => s.studentId === studentId)

    const pad = compact ? "px-0 py-2" : "px-5 py-3.5"

    return (
        <div className={`${pad} flex items-center gap-4 hover:bg-muted/5 transition-colors ${compact ? "" : ""}`}>
            {/* Score ring */}
            <div className="shrink-0">
                {score ? (
                    <ScoreRing percentage={score.percentage} size={compact ? 40 : 48} strokeWidth={compact ? 3 : 4} />
                ) : (
                    <div className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-full bg-muted/20 flex items-center justify-center`}>
                        <Target className="h-4 w-4 text-muted-foreground/75" />
                    </div>
                )}
            </div>

            {/* Test info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`${compact ? "text-[12.5px]" : "text-[13px]"} font-semibold text-foreground truncate`}>{test.title}</p>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-semibold border-border/40 text-muted-foreground/80 shrink-0 rounded">
                        {testTypeLabel(test.testType)}
                    </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {test.subject} · {new Date(test.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · Total: {test.totalMarks}
                </p>
            </div>

            {/* Score details */}
            <div className="text-right shrink-0">
                {score ? (
                    <>
                        <p className={`${compact ? "text-[13px]" : "text-[14px]"} font-bold tabular-nums text-foreground`}>
                            {score.marksObtained}<span className="text-muted-foreground/70 font-medium">/{test.totalMarks}</span>
                        </p>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            {score.grade && (
                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-bold border-0 rounded ${scoreColor(score.percentage).text} ${scoreColor(score.percentage).bg}/10`}>
                                    {score.grade}
                                </Badge>
                            )}
                            <span className={`text-[10px] font-bold ${score.status === "PASS" ? "text-emerald-500" : score.status === "FAIL" ? "text-red-500" : "text-muted-foreground/70"}`}>
                                {score.status === "PASS" ? "Passed" : score.status === "FAIL" ? "Failed" : "Absent"}
                            </span>
                        </div>
                    </>
                ) : (
                    <p className="text-[11px] text-muted-foreground/70">No score</p>
                )}
            </div>
        </div>
    )
}

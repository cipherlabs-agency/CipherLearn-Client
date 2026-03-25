"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Check,
    X,
    Loader2,
    UserCheck,
    UserX,
    Users,
    Save,
} from "lucide-react"
import {
    useGetBatchAttendanceByDateQuery,
    useMarkBulkAttendanceMutation,
} from "@/redux/slices/attendance/attendanceApi"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { Batch, Student, AttendanceStatus } from "@/types"
import { useSelector, useDispatch } from "react-redux"
import { setBatch, setDate, setSelectedBatchId } from "@/redux/slices/attendance/attendanceSlice"
import { RootState } from "@/redux/store"
import { toast } from "sonner"

interface AttendanceStateItem {
    studentId: number
    studentName: string
    email: string
    status: AttendanceStatus
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.charAt(0).toUpperCase()
}

export function AttendanceMarker() {
    const dispatch = useDispatch()
    const { date, selectedBatchId } = useSelector((state: RootState) => state.attendance)

    const [attendanceStates, setAttendanceStates] = useState<AttendanceStateItem[]>([])

    // Fetch batches
    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    // Auto-select first batch if none selected
    useEffect(() => {
        if (!selectedBatchId && batches.length > 0) {
            const firstBatch = batches[0]
            dispatch(setSelectedBatchId(firstBatch.id))
            dispatch(setBatch(firstBatch.name))
        }
    }, [batches, selectedBatchId, dispatch])

    // Fetch students for selected batch
    const { data: studentsPageData, isLoading: loadingStudents } = useGetStudentsQuery(
        selectedBatchId ? { batchId: selectedBatchId, limit: 500 } : undefined,
        { skip: !selectedBatchId }
    )
    const students = studentsPageData?.students ?? []

    // Fetch existing attendance for the selected date
    const { data: existingAttendance, isLoading: loadingAttendance } = useGetBatchAttendanceByDateQuery(
        { batchId: selectedBatchId!, date },
        { skip: !selectedBatchId }
    )

    // Save attendance mutation
    const [saveAttendance, { isLoading: isSaving }] = useMarkBulkAttendanceMutation()

    // Initialize — default to PRESENT (teacher only marks absents)
    useEffect(() => {
        if (students && students.length > 0) {
            const existingMap = new Map(
                existingAttendance?.map(a => [a.studentId, a.status]) || []
            )
            const states: AttendanceStateItem[] = students.map((student: Student) => ({
                studentId: student.id,
                studentName: student.fullname,
                email: student.email,
                status: existingMap.has(student.id) ? existingMap.get(student.id)! : 'PRESENT'
            }))
            setAttendanceStates(states)
        }
    }, [students, existingAttendance])

    const handleBatchChange = (batchId: string) => {
        const id = Number(batchId)
        dispatch(setSelectedBatchId(id))
        const batch = batches.find((b: Batch) => b.id === id)
        if (batch) dispatch(setBatch(batch.name))
    }

    const handleToggle = useCallback((studentId: number) => {
        setAttendanceStates(prev =>
            prev.map(state =>
                state.studentId === studentId
                    ? { ...state, status: state.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
                    : state
            )
        )
    }, [])

    const handleMarkAllPresent = () => {
        setAttendanceStates(prev => prev.map(state => ({ ...state, status: 'PRESENT' })))
    }

    const handleMarkAllAbsent = () => {
        setAttendanceStates(prev => prev.map(state => ({ ...state, status: 'ABSENT' })))
    }

    const isLoading = loadingStudents || loadingAttendance
    const presentCount = attendanceStates.filter(s => s.status === 'PRESENT').length
    const absentCount = attendanceStates.filter(s => s.status === 'ABSENT').length
    const totalCount = attendanceStates.length

    const handleSave = async () => {
        if (!selectedBatchId) { toast.error("Please select a batch first"); return }
        try {
            await saveAttendance({
                batchId: selectedBatchId,
                date,
                attendances: attendanceStates.map(s => ({ studentId: s.studentId, status: s.status }))
            }).unwrap()
            toast.success(`Attendance saved! ${presentCount} present, ${absentCount} absent.`)
        } catch (error: any) {
            toast.error(error?.data?.message || "Couldn't save attendance. Please try again.")
        }
    }

    // ─── Loading ───
    if (isLoading && selectedBatchId) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-12 rounded-xl bg-muted/20" />
                    <Skeleton className="h-12 rounded-xl bg-muted/20" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl bg-muted/15" />
                    ))}
                </div>
            </div>
        )
    }

    const selectedBatch = batches.find((b: Batch) => b.id === selectedBatchId)

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">

            {/* ─── Controls: Batch + Date (inline) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Choose Batch
                    </label>
                    <Select value={String(selectedBatchId || "")} onValueChange={handleBatchChange}>
                        <SelectTrigger className="h-10 text-[13px] font-medium rounded-xl border-border/60">
                            <SelectValue placeholder="Select a batch…" />
                        </SelectTrigger>
                        <SelectContent>
                            {batches.map((batch: Batch) => (
                                <SelectItem key={batch.id} value={String(batch.id)}>
                                    <span className="font-semibold">{batch.name}</span>
                                    {batch.timings?.time && (
                                        <span className="ml-2 text-muted-foreground text-[11px]">• {batch.timings.time}</span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Date
                    </label>
                    <Input
                        type="date"
                        className="h-10 text-[13px] font-medium rounded-xl border-border/60"
                        value={date}
                        onChange={(e) => dispatch(setDate(e.target.value))}
                    />
                </div>
            </div>

            {selectedBatchId && totalCount > 0 ? (
                <>
                    {/* ─── Live Counter + Quick Actions ─── */}
                    <div className="flex items-center justify-between flex-wrap gap-2 py-1">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                                </div>
                                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{presentCount}</span>
                                <span className="text-[11px] font-medium text-muted-foreground">Present</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-md bg-red-500/15 flex items-center justify-center">
                                    <X className="h-3 w-3 text-red-500" strokeWidth={3} />
                                </div>
                                <span className="text-[13px] font-bold text-red-500 tabular-nums">{absentCount}</span>
                                <span className="text-[11px] font-medium text-muted-foreground">Absent</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                                / {totalCount} students
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline" size="sm"
                                className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1"
                                onClick={handleMarkAllPresent}
                            >
                                <UserCheck className="h-3 w-3" /> All Present
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-border/50 text-muted-foreground hover:bg-muted/10 gap-1"
                                onClick={handleMarkAllAbsent}
                            >
                                <UserX className="h-3 w-3" /> All Absent
                            </Button>
                        </div>
                    </div>

                    {/* ─── Student Grid (3-4 columns → fits 30-40 students without scrolling) ─── */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                        {attendanceStates.map((state) => {
                            const isPresent = state.status === 'PRESENT'

                            return (
                                <button
                                    key={state.studentId}
                                    type="button"
                                    onClick={() => handleToggle(state.studentId)}
                                    className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer select-none text-left group active:scale-[0.97] ${
                                        isPresent
                                            ? "bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/35"
                                            : "bg-red-500/5 border-red-500/15 hover:bg-red-500/10 hover:border-red-500/30"
                                    }`}
                                >
                                    {/* Status indicator */}
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                                        isPresent
                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                                            : "bg-red-500/15 text-red-500"
                                    }`}>
                                        {isPresent
                                            ? <Check className="h-4 w-4" strokeWidth={3} />
                                            : <X className="h-4 w-4" strokeWidth={2.5} />
                                        }
                                    </div>

                                    {/* Name (compact) */}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-[12.5px] font-semibold truncate leading-tight transition-colors ${
                                            isPresent ? "text-foreground" : "text-muted-foreground"
                                        }`}>
                                            {state.studentName}
                                        </p>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 transition-colors ${
                                            isPresent
                                                ? "text-emerald-600/70 dark:text-emerald-400/70"
                                                : "text-red-500/60"
                                        }`}>
                                            {isPresent ? "Present" : "Absent"}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* ─── Save Button ─── */}
                    <div className="pt-2">
                        <Button
                            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold hover:bg-primary/90 transition-all active:scale-[0.99] shadow-lg shadow-primary/10 gap-2"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                            ) : (
                                <><Save className="h-4 w-4" /> Save Attendance</>
                            )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium">
                            {selectedBatch?.name} • {new Date(date + 'T00:00:00').toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                        </p>
                    </div>
                </>
            ) : selectedBatchId ? (
                <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/50 text-center rounded-xl">
                    <Users className="h-7 w-7 text-foreground/15 mb-3" />
                    <h3 className="text-sm font-semibold mb-1">No students in this batch</h3>
                    <p className="text-[12.5px] text-muted-foreground max-w-[280px] leading-relaxed">
                        Add students to this batch first, then come back to take attendance.
                    </p>
                </Card>
            ) : (
                <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/50 text-center rounded-xl">
                    <Users className="h-7 w-7 text-foreground/15 mb-3" />
                    <h3 className="text-sm font-semibold mb-1">Pick a batch to get started</h3>
                    <p className="text-[12.5px] text-muted-foreground max-w-[280px] leading-relaxed">
                        Choose a batch above and today&apos;s date is already set.
                    </p>
                </Card>
            )}
        </div>
    )
}

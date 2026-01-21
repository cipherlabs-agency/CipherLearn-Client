"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Loader2, UserCheck, UserX } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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

export function AttendanceMarker() {
    const dispatch = useDispatch()
    const { currentBatch, date, selectedBatchId } = useSelector((state: RootState) => state.attendance)

    const [attendanceStates, setAttendanceStates] = useState<AttendanceStateItem[]>([])

    // Fetch batches for dropdown
    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    // Fetch students for selected batch
    const { data: students, isLoading: loadingStudents } = useGetStudentsQuery(
        selectedBatchId || undefined,
        { skip: !selectedBatchId }
    )

    // Fetch existing attendance for the selected date
    const { data: existingAttendance, isLoading: loadingAttendance } = useGetBatchAttendanceByDateQuery(
        { batchId: selectedBatchId!, date },
        { skip: !selectedBatchId }
    )

    // Save attendance mutation
    const [saveAttendance, { isLoading: isSaving }] = useMarkBulkAttendanceMutation()

    // Initialize attendance states when students or existing attendance changes
    useEffect(() => {
        if (students && students.length > 0) {
            const existingMap = new Map(
                existingAttendance?.map(a => [a.studentId, a.status]) || []
            )

            const states: AttendanceStateItem[] = students.map((student: Student) => ({
                studentId: student.id,
                studentName: student.fullname,
                email: student.email,
                status: existingMap.get(student.id) || 'ABSENT'
            }))

            setAttendanceStates(states)
        }
    }, [students, existingAttendance])

    const handleBatchChange = (batchId: string) => {
        const id = Number(batchId)
        dispatch(setSelectedBatchId(id))
        const batch = batches.find((b: Batch) => b.id === id)
        if (batch) {
            dispatch(setBatch(batch.name))
        }
    }

    const handleStatusToggle = (studentId: number) => {
        setAttendanceStates(prev =>
            prev.map(state =>
                state.studentId === studentId
                    ? { ...state, status: state.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
                    : state
            )
        )
    }

    const handleMarkAllPresent = () => {
        setAttendanceStates(prev =>
            prev.map(state => ({ ...state, status: 'PRESENT' }))
        )
    }

    const handleMarkAllAbsent = () => {
        setAttendanceStates(prev =>
            prev.map(state => ({ ...state, status: 'ABSENT' }))
        )
    }

    const isLoading = loadingStudents || loadingAttendance
    const presentCount = attendanceStates.filter(s => s.status === 'PRESENT').length
    const absentCount = attendanceStates.filter(s => s.status === 'ABSENT').length
    const totalCount = attendanceStates.length

    const handleSave = async () => {
        if (!selectedBatchId) {
            toast.error("Please select a batch")
            return
        }

        try {
            await saveAttendance({
                batchId: selectedBatchId,
                date,
                attendances: attendanceStates.map(s => ({
                    studentId: s.studentId,
                    status: s.status
                }))
            }).unwrap()

            toast.success("Attendance saved successfully")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to save attendance")
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card-vercel h-24 flex flex-col justify-center">
                        <Skeleton className="h-4 w-32 bg-muted/40 mb-2" />
                        <Skeleton className="h-8 w-full bg-muted/20" />
                    </div>
                    <div className="card-vercel h-24 flex flex-col justify-center">
                        <Skeleton className="h-4 w-32 bg-muted/40 mb-2" />
                        <Skeleton className="h-8 w-full bg-muted/20" />
                    </div>
                </div>
                <div className="card-vercel !px-0 !py-0 border-border">
                    <div className="p-8 border-b border-border">
                        <Skeleton className="h-6 w-48 bg-muted/30" />
                    </div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="px-8 py-4 border-b border-border flex items-center gap-4">
                            <Skeleton className="h-5 w-5 bg-muted/40 rounded" />
                            <Skeleton className="h-8 w-8 rounded-full bg-muted/30" />
                            <Skeleton className="h-4 w-48 bg-muted/20 flex-1" />
                            <Skeleton className="h-5 w-20 bg-muted/30 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Academic Batch</label>
                        <Select
                            value={String(selectedBatchId || "")}
                            onValueChange={handleBatchChange}
                        >
                            <SelectTrigger className="h-10 text-xs font-medium border-border/60">
                                <SelectValue placeholder="Select program node..." />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((batch: Batch) => (
                                    <SelectItem key={batch.id} value={String(batch.id)}>
                                        <span className="font-medium">{batch.name}</span>
                                        <span className="ml-2 text-muted-foreground opacity-60">• {batch.timings?.time || 'pending'}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Verification Date</label>
                        <Input
                            type="date"
                            className="h-10 text-xs font-medium border-border/60 hover:border-foreground/20"
                            value={date}
                            onChange={(e) => dispatch(setDate(e.target.value))}
                        />
                    </div>
                    <Card className="p-4 flex flex-col justify-center border-border/60">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live Quorum</span>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2 mt-2">
                            <span className="text-2xl font-bold tracking-tighter leading-none">{presentCount}</span>
                            <span className="text-xs font-medium text-muted-foreground mb-1">/ {totalCount} Records</span>
                        </div>
                    </Card>
                </div>
            </div>

            {selectedBatchId ? (
                <Card className="!p-0 border-border overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/5">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">Roll Call Matrix</h3>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 opacity-60">Verification Queue: {totalCount} Students Initialized</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-4 font-semibold text-[10px] uppercase tracking-widest border-border/60 hover:border-foreground/20"
                                onClick={handleMarkAllPresent}
                            >
                                <UserCheck className="h-3.5 w-3.5 mr-2" />
                                Quorum Present
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-4 font-semibold text-[10px] uppercase tracking-widest border-border/60 hover:border-foreground/20"
                                onClick={handleMarkAllAbsent}
                            >
                                <UserX className="h-3.5 w-3.5 mr-2" />
                                Reset All
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/5">
                                <TableRow className="hover:bg-transparent border-border/60">
                                    <TableHead className="w-[80px] text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground py-4">Auth</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground py-4 pl-6">Identity</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground py-4">Metadata Alias</TableHead>
                                    <TableHead className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground py-4 pr-12">Registry Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceStates.map((state) => (
                                    <TableRow 
                                        key={state.studentId} 
                                        className="group border-border/40 hover:bg-muted/30 transition-colors"
                                    >
                                        <TableCell className="text-center py-4">
                                            <Checkbox
                                                id={`student-${state.studentId}`}
                                                checked={state.status === 'PRESENT'}
                                                onCheckedChange={() => handleStatusToggle(state.studentId)}
                                                className="h-4.5 w-4.5 rounded border-border"
                                            />
                                        </TableCell>
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] border transition-all duration-300 ${
                                                    state.status === 'PRESENT' 
                                                        ? 'bg-foreground text-background border-foreground' 
                                                        : 'bg-muted/30 border-border/60 text-muted-foreground/40'
                                                }`}>
                                                    {state.studentName.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm tracking-tight leading-none transition-colors ${
                                                        state.status === 'PRESENT' ? 'text-foreground' : 'text-muted-foreground/60'
                                                    }`}>{state.studentName}</span>
                                                    <span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest mt-1">UUID • {state.studentId}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[11px] font-medium text-muted-foreground/60 lowercase tracking-tight">
                                            {state.email}
                                        </TableCell>
                                        <TableCell className="text-right pr-12">
                                            <div className={`text-[9px] font-semibold px-2 py-0.5 rounded border inline-block uppercase tracking-widest transition-all ${
                                                state.status === 'PRESENT' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/10 text-rose-500/50 bg-rose-500/5'
                                            }`}>
                                                {state.status === 'PRESENT' ? 'Verified' : 'Absent'}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-12 bg-muted/5 border-t border-border flex flex-col items-center gap-4">
                        <Button
                            className="min-w-[320px] h-11 rounded-md bg-foreground text-background text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-foreground/90 transition-all active:scale-[0.98]"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? "Synchronizing..." : "Submit Registry"}
                        </Button>
                        <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">Protocol vercel_geist_v1.0 • encrypted submission</p>
                    </div>
                </Card>
            ) : (
                <Card className="text-center py-32 border-dashed border-border/60 bg-background/50 flex flex-col items-center">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Initialization Required</h3>
                    <p className="text-[11px] text-muted-foreground mt-2 max-w-[280px] mx-auto font-medium leading-relaxed">Select an active batch and verification date to initialize the session manifest.</p>
                </Card>
            )}
        </div>
    )
}

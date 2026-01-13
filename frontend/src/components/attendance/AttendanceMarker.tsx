"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { CheckCircle2, Loader2, UserCheck, UserX } from "lucide-react"
import {
    useGetBatchAttendanceByDateQuery,
    useMarkBulkAttendanceMutation,
} from "@/redux/slices/attendance/attendanceApi"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useSelector, useDispatch } from "react-redux"
import { setBatch, setDate, setSelectedBatchId } from "@/redux/slices/attendance/attendanceSlice"
import { RootState } from "@/redux/store"
import { toast } from "sonner"

interface AttendanceState {
    studentId: number
    studentName: string
    email: string
    status: 'PRESENT' | 'ABSENT'
}

export function AttendanceMarker() {
    const dispatch = useDispatch()
    const { currentBatch, date, selectedBatchId } = useSelector((state: RootState) => state.attendance)

    const [attendanceStates, setAttendanceStates] = useState<AttendanceState[]>([])

    // Fetch batches for dropdown
    const { data: batchesData } = useGetAllBatchesQuery({})
    const batches = batchesData?.data || []

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

            const states: AttendanceState[] = students.map((student: any) => ({
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
        const batch = batches.find((b: any) => b.id === id)
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

    const isLoading = loadingStudents || loadingAttendance

    const presentCount = attendanceStates.filter(s => s.status === 'PRESENT').length
    const absentCount = attendanceStates.filter(s => s.status === 'ABSENT').length

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedBatchId || ""}
                    onChange={(e) => handleBatchChange(e.target.value)}
                >
                    <option value="">Select Batch...</option>
                    {batches.map((batch: any) => (
                        <option key={batch.id} value={batch.id}>
                            {batch.name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={date}
                    onChange={(e) => dispatch(setDate(e.target.value))}
                />

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllPresent}
                        disabled={!selectedBatchId || isLoading}
                    >
                        <UserCheck className="mr-1 h-4 w-4" />
                        All Present
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAbsent}
                        disabled={!selectedBatchId || isLoading}
                    >
                        <UserX className="mr-1 h-4 w-4" />
                        All Absent
                    </Button>
                </div>
            </div>

            {/* Statistics */}
            {selectedBatchId && attendanceStates.length > 0 && (
                <div className="flex gap-4 text-sm">
                    <span className="text-green-600">Present: {presentCount}</span>
                    <span className="text-red-600">Absent: {absentCount}</span>
                    <span className="text-muted-foreground">Total: {attendanceStates.length}</span>
                </div>
            )}

            {!selectedBatchId ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    Please select a batch to mark attendance
                </div>
            ) : isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : attendanceStates.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    No students found in this batch
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={presentCount === attendanceStates.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) handleMarkAllPresent()
                                            else handleMarkAllAbsent()
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceStates.map((state) => (
                                <TableRow key={state.studentId}>
                                    <TableCell>
                                        <Checkbox
                                            checked={state.status === 'PRESENT'}
                                            onCheckedChange={() => handleStatusToggle(state.studentId)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{state.studentName}</TableCell>
                                    <TableCell className="text-muted-foreground">{state.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${state.status === 'PRESENT'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {state.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStatusToggle(state.studentId)}
                                        >
                                            Toggle
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-4 flex justify-end">
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleSave}
                            disabled={isSaving || attendanceStates.length === 0}
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!isSaving && <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Save Attendance
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

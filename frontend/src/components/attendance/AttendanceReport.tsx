"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { FileDown, Loader2, BarChart3 } from "lucide-react"
import { useGetAttendanceReportQuery } from "@/redux/slices/attendance/attendanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"

export function AttendanceReport() {
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
    )
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    )

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const { data: report, isLoading, isFetching } = useGetAttendanceReportQuery(
        { batchId: selectedBatchId!, startDate, endDate },
        { skip: !selectedBatchId }
    )

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

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5" />
                        Attendance Report
                    </CardTitle>
                    <CardDescription>
                        Generate attendance reports for batches within a date range
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
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
                            <label className="text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={handleExportCSV}
                                disabled={!report}
                                variant="outline"
                                className="w-full"
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Results */}
            {!selectedBatchId ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    Please select a batch to view the report
                </div>
            ) : (isLoading || isFetching) ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : report ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Batch
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{report.batchName}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Students
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{report.totalStudents}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Date Range
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium">
                                    {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Overall Attendance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold">{report.overallAttendancePercentage}%</span>
                                    <Progress value={report.overallAttendancePercentage} className="flex-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Student Statistics Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Attendance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-center">Present</TableHead>
                                        <TableHead className="text-center">Absent</TableHead>
                                        <TableHead className="text-center">Total</TableHead>
                                        <TableHead>Attendance %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.studentStats.map((student) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell className="font-medium">{student.studentName}</TableCell>
                                            <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                            <TableCell className="text-center text-green-600">{student.presentDays}</TableCell>
                                            <TableCell className="text-center text-red-600">{student.absentDays}</TableCell>
                                            <TableCell className="text-center">{student.totalDays}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress
                                                        value={student.percentage}
                                                        className={`w-24 ${student.percentage >= 75 ? '' :
                                                                student.percentage >= 50 ? '[&>div]:bg-yellow-500' :
                                                                    '[&>div]:bg-red-500'
                                                            }`}
                                                    />
                                                    <span className={`text-sm font-medium ${student.percentage >= 75 ? 'text-green-600' :
                                                            student.percentage >= 50 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                        }`}>
                                                        {student.percentage}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    No data available for the selected criteria
                </div>
            )}
        </div>
    )
}

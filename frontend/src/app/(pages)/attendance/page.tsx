"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker"
import { AttendanceReport } from "@/components/attendance/AttendanceReport"
import { QRCodeGenerator } from "@/components/attendance/QRCodeGenerator"
import { QRCodeScanner } from "@/components/attendance/QRCodeScanner"
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"

export default function AttendancePage() {
    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'TEACHER'

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                    <p className="text-muted-foreground">Mark and track student attendance.</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin ? (
                        <QRCodeGenerator />
                    ) : (
                        <QRCodeScanner studentId={user?.id || 0} />
                    )}
                </div>
            </div>

            <Tabs defaultValue={isAdmin ? "mark" : "history"} className="space-y-4">
                <TabsList>
                    {isAdmin && <TabsTrigger value="mark">Mark Attendance</TabsTrigger>}
                    <TabsTrigger value="history">History</TabsTrigger>
                    {isAdmin && <TabsTrigger value="report">Reports</TabsTrigger>}
                    {isAdmin && <TabsTrigger value="qr">QR Attendance</TabsTrigger>}
                </TabsList>

                {isAdmin && (
                    <TabsContent value="mark" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance Register</CardTitle>
                                <CardDescription>Mark attendance for today's session.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AttendanceMarker />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance History</CardTitle>
                            <CardDescription>View past attendance records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendanceHistory />
                        </CardContent>
                    </Card>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="report">
                        <AttendanceReport />
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="qr">
                        <Card>
                            <CardHeader>
                                <CardTitle>QR Code Attendance</CardTitle>
                                <CardDescription>
                                    Generate QR codes for students to scan and mark their attendance.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Generate a daily QR code and display it for students to scan.
                                        The QR code is unique for each batch and expires at the end of the day.
                                    </p>
                                    <QRCodeGenerator />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, CalendarDays } from "lucide-react"
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker"

export default function AttendancePage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                    <p className="text-muted-foreground">Mark and track student attendance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <CalendarDays className="mr-2 h-4 w-4" /> View Calendar
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="mark" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="report">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="mark" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Register</CardTitle>
                            <CardDescription>Mark attendance for today&apos;s session.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendanceMarker />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance History</CardTitle>
                            <CardDescription>View past attendance records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-8 text-muted-foreground">
                                Calendar View Placeholder
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

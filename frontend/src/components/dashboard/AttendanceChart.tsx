"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export function AttendanceChart() {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Weekly student attendance average.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Attendance Analytics Coming Soon</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        This chart will display weekly attendance trends based on real data
                        from the attendance tracking system.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}


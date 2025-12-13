"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { KPIStats } from "@/components/dashboard/KPIStats"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { AttendanceChart } from "@/components/dashboard/AttendanceChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { StudentDistribution } from "@/components/dashboard/StudentDistribution"

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your institute&apos;s performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* CalendarDateRangePicker placeholder */}
                    <Button variant="outline">This Month</Button>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Download className="mr-2 h-4 w-4" /> Download Report
                    </Button>
                </div>
            </div>

            <KPIStats />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RevenueChart />
                <AttendanceChart />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ActivityFeed />
                <StudentDistribution />
            </div>
        </div>
    )
}

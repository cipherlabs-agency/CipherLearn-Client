"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { KPIStats } from "@/components/dashboard/KPIStats"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { AttendanceChart } from "@/components/dashboard/AttendanceChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { StudentDistribution } from "@/components/dashboard/StudentDistribution"
import { useAppSelector } from "@/redux/hooks"
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog"

function getTimeOfDay() {
    const hour = new Date().getHours()
    if (hour < 12) return "morning"
    if (hour < 17) return "afternoon"
    return "evening"
}

export default function DashboardPage() {
    const { user } = useAppSelector((state) => state.auth)
    const firstName = user?.name?.split(" ")[0] || "Teacher"
    const timeOfDay = getTimeOfDay()

    return (
        <div className="space-y-7 animate-children">

            {/* Page Header — warm, personal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Good {timeOfDay},{" "}
                        <span className="text-primary">{firstName}!</span>
                    </h1>
                    <p className="text-[13.5px] text-muted-foreground mt-1">
                        Here&rsquo;s what&rsquo;s happening in your classes today.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <EditProfileDialog user={user} />
                    <Button variant="outline" size="sm" className="text-[13px]">
                        Oct 2023 — Nov 2023
                    </Button>
                    <Button size="sm" className="text-[13px] gap-2">
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Stats */}
            <section>
                <KPIStats />
            </section>

            {/* Charts Row */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <RevenueChart />
                </div>
                <div className="lg:col-span-4">
                    <AttendanceChart />
                </div>
            </div>

            {/* Activity + Distribution */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12 pb-4">
                <div className="lg:col-span-7">
                    <ActivityFeed />
                </div>
                <div className="lg:col-span-5">
                    <StudentDistribution />
                </div>
            </div>
        </div>
    )
}

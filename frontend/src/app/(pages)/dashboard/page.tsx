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

export default function DashboardPage() {
    const { user } = useAppSelector((state) => state.auth)

    return (
        <div className="space-y-8 py-6 px-6">
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Welcome back, <span className="font-medium text-foreground">{user?.name || "User"}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                   <EditProfileDialog user={user} />
                    <Button variant="outline" className="h-8 px-3 text-xs">
                        Oct 2023 — Nov 2023
                    </Button>
                    <Button className="h-8 px-3 text-xs gap-2">
                        <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                </div>
            </div>

            <section>
                <KPIStats />
            </section>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <RevenueChart />
                </div>
                <div className="lg:col-span-4">
                    <AttendanceChart />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 pb-6">
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

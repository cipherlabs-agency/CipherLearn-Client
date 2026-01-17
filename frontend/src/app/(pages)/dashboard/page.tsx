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
        <div className="space-y-12 py-10 px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm font-medium">
                        Welcome back, <span className="font-semibold text-foreground">{user?.name || "User"}</span>. Review your daily operations.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <EditProfileDialog user={user} />
                    <Button variant="outline" className="h-9 px-4 text-[11px] font-semibold uppercase tracking-widest rounded-md border-border/60 hover:bg-muted/50 transition-all">
                        Oct 2023 — Nov 2023
                    </Button>
                    <Button className="h-9 px-4 text-[11px] font-semibold uppercase tracking-widest rounded-md bg-foreground text-background hover:opacity-90 transition-all shadow-sm">
                        <Download className="mr-2 h-3.5 w-3.5" /> Export Report
                    </Button>
                </div>
            </div>

            <section className="space-y-8">
                <KPIStats />
            </section>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12 auto-rows-min">
                <div className="lg:col-span-8">
                    <RevenueChart />
                </div>
                <div className="lg:col-span-4">
                    <AttendanceChart />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12 auto-rows-min pb-12">
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

"use client"

import { Users, BookOpen, CalendarCheck, TrendingUp, TrendingDown } from "lucide-react"
import { useGetDashboardStatsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"

export function KPIStats() {
    const { data: stats, isLoading, error } = useGetDashboardStatsQuery()

    if (isLoading) {
        return (
            <div className="grid gap-px bg-border rounded-lg border border-border overflow-hidden md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-background p-5">
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const statsData = [
        {
            title: "Total Students",
            value: stats?.totalStudents || 0,
            icon: Users,
            trend: stats?.monthlyGrowth?.students || 0,
            trendLabel: "vs last month"
        },
        {
            title: "Active Batches",
            value: stats?.totalBatches || 0,
            icon: BookOpen,
            trend: 0,
            trendLabel: "total active"
        },
        {
            title: "Today Present",
            value: stats?.todayAttendance?.present || 0,
            icon: CalendarCheck,
            trend: stats?.todayAttendance?.percentage || 0,
            trendLabel: "attendance rate"
        },
        {
            title: "Attendance Growth",
            value: `${stats?.monthlyGrowth?.attendance || 0}%`,
            icon: TrendingUp,
            trend: stats?.monthlyGrowth?.attendance || 0,
            trendLabel: "vs last month"
        }
    ]

    return (
        <div className="grid gap-px bg-border rounded-lg border border-border overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => {
                const trendUp = stat.trend >= 0
                return (
                    <div key={index} className="bg-background p-5 flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                            <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                        </div>

                        <div className="mt-auto">
                            <div className="text-3xl font-semibold tracking-tight text-foreground">
                                {stat.value}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className={`text-xs font-medium flex items-center gap-0.5 ${trendUp ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                </span>
                                <span className="text-[11px] text-muted-foreground">{stat.trendLabel}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

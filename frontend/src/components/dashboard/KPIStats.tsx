"use client"

import { Users, BookOpen, CalendarCheck, TrendingUp, TrendingDown } from "lucide-react"
import { useGetDashboardStatsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function KPIStats() {
    const { data: stats, isLoading, error } = useGetDashboardStatsQuery()

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </div>
                            <div>
                                <Skeleton className="h-7 w-12 mb-2" />
                                <div className="flex items-center gap-1.5">
                                    <Skeleton className="h-3 w-10" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </div>
                    </Card>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => {
                const trendUp = stat.trend >= 0
                return (
                    <Card key={index} className="p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div>
                                <div className="text-2xl font-semibold text-foreground">
                                    {stat.value}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-xs font-medium flex items-center gap-0.5 ${trendUp ? 'text-success' : 'text-error'}`}>
                                        {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">{stat.trendLabel}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

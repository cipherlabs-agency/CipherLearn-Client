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
                    <Card key={i} className="h-[140px] flex flex-col justify-between border-border/60">
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-4 w-24 bg-muted/40" />
                            <Skeleton className="h-8 w-16 bg-muted/60" />
                            <Skeleton className="h-4 w-32 bg-muted/30" />
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
                    <Card key={index} className="p-6 group cursor-pointer hover:border-foreground/20 hover:shadow-sm transition-all border-border/60">
                        <div className="flex flex-col h-full justify-between gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] opacity-80">{stat.title}</span>
                                <stat.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                            </div>

                            <div>
                                <div className="text-2xl font-bold tracking-tighter text-foreground">
                                    {stat.value}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-50">{stat.trendLabel}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

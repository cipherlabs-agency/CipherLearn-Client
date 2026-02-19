"use client"

import { Users, BookOpen, CalendarCheck, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useGetDashboardStatsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const statConfig = [
    {
        key: "students",
        title: "Total Students",
        icon: Users,
        // Teal — primary brand color
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        accentColor: "from-primary/5",
    },
    {
        key: "batches",
        title: "Active Classes",
        icon: BookOpen,
        // Amber — warm energy
        iconBg: "bg-accent/10",
        iconColor: "text-amber-600",
        accentColor: "from-amber-50/60",
    },
    {
        key: "attendance",
        title: "Present Today",
        icon: CalendarCheck,
        // Green — positive
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-700",
        accentColor: "from-emerald-50/60",
    },
    {
        key: "growth",
        title: "Attendance Growth",
        icon: TrendingUp,
        // Purple — analytics
        iconBg: "bg-violet-100",
        iconColor: "text-violet-700",
        accentColor: "from-violet-50/60",
    },
]

export function KPIStats() {
    const { data: stats, isLoading } = useGetDashboardStatsQuery()

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-[0_1px_3px_rgba(28,25,23,0.06)]">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                        <Skeleton className="h-9 w-20 mt-3" />
                        <Skeleton className="h-3.5 w-24" />
                    </div>
                ))}
            </div>
        )
    }

    const statsData = [
        {
            ...statConfig[0],
            value: stats?.totalStudents ?? 0,
            trend: stats?.monthlyGrowth?.students ?? 0,
            trendLabel: "vs last month",
        },
        {
            ...statConfig[1],
            value: stats?.totalBatches ?? 0,
            trend: 0,
            trendLabel: "currently active",
        },
        {
            ...statConfig[2],
            value: stats?.todayAttendance?.present ?? 0,
            trend: stats?.todayAttendance?.percentage ?? 0,
            trendLabel: "attendance rate",
        },
        {
            ...statConfig[3],
            value: `${stats?.monthlyGrowth?.attendance ?? 0}%`,
            trend: stats?.monthlyGrowth?.attendance ?? 0,
            trendLabel: "vs last month",
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => {
                const trendUp = stat.trend >= 0
                const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight

                return (
                    <div
                        key={index}
                        className={cn(
                            "relative rounded-xl border border-border bg-card p-5 overflow-hidden",
                            "shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]",
                            "transition-all duration-200 hover:shadow-[0_4px_16px_rgba(28,25,23,0.10)] hover:-translate-y-0.5"
                        )}
                    >
                        {/* Subtle gradient accent */}
                        <div className={cn(
                            "absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-bl opacity-40",
                            stat.accentColor
                        )} />

                        <div className="relative">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2 mb-4">
                                <p className="text-[12.5px] font-semibold text-muted-foreground leading-tight">
                                    {stat.title}
                                </p>
                                <div className={cn(
                                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                                    stat.iconBg
                                )}>
                                    <stat.icon className={cn("h-[18px] w-[18px]", stat.iconColor)} />
                                </div>
                            </div>

                            {/* Value */}
                            <div className="text-3xl font-bold text-foreground tracking-tight mb-2">
                                {stat.value}
                            </div>

                            {/* Trend */}
                            <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    "inline-flex items-center gap-0.5 text-[12px] font-semibold rounded-full px-1.5 py-0.5",
                                    trendUp
                                        ? "text-emerald-700 bg-emerald-100"
                                        : "text-red-600 bg-red-100"
                                )}>
                                    <TrendIcon className="h-3 w-3" />
                                    {stat.trend > 0 ? "+" : ""}{stat.trend}%
                                </span>
                                <span className="text-[12px] text-muted-foreground">{stat.trendLabel}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

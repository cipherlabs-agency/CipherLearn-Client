"use client"

import { useState } from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useGetEnrollmentTrendsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DurationFilter,
    DurationFilterSelect,
    ChartTooltip,
    getDurationParams,
    CHART_COLORS,
    CHART_MARGINS,
    axisConfig,
    gridConfig,
    verticalCursorStyle,
    DURATION_OPTIONS,
} from "./chart-config"

interface ChartDataPoint {
    name: string
    enrollments: number
}

export function RevenueChart() {
    const [duration, setDuration] = useState<DurationFilter>("year")
    const { months } = getDurationParams(duration)

    const { data: trends, isLoading, isFetching } = useGetEnrollmentTrendsQuery({ months })
    const isRefreshing = isFetching && !isLoading

    if (isLoading) {
        return (
            <div className="col-span-8 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
                <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-7 w-48" />
                    </div>
                </div>
                <div className="p-5">
                    <Skeleton className="h-[280px] w-full rounded" />
                </div>
            </div>
        )
    }

    const chartData: ChartDataPoint[] = trends?.map(t => ({
        name: t.label,
        enrollments: t.count
    })) || []

    const totalEnrollments = chartData.reduce((sum, d) => sum + d.enrollments, 0)
    const hasData = totalEnrollments > 0

    const durationLabel = DURATION_OPTIONS.find(o => o.value === duration)?.label || ""

    if (!hasData) {
        return (
            <div className="col-span-8 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
                <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[15px] font-bold text-foreground">Enrollment Trends</h3>
                            <p className="text-[12.5px] text-muted-foreground mt-0.5">Monthly Growth Analysis</p>
                        </div>
                        <DurationFilterSelect value={duration} onChange={setDuration} />
                    </div>
                </div>
                <div className="p-5">
                    <div className="h-[280px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-[15px] font-bold text-foreground">No Enrollment Data</p>
                        <p className="text-xs text-muted-foreground mt-1">Add students to see enrollment trends</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="col-span-8 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
            <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                    <h3 className="text-[15px] font-bold text-foreground">Enrollment Trends</h3>
                    <p className="text-[13.5px] text-muted-foreground mt-0.5">Monthly Growth Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                            {totalEnrollments.toLocaleString()}
                        </div>
                        <div className="text-[13px] text-muted-foreground">Total ({durationLabel})</div>
                    </div>
                    <DurationFilterSelect value={duration} onChange={setDuration} />
                </div>
            </div>
            <div className="p-5">
                <div className="h-[280px] w-full relative">
                    {isRefreshing && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded transition-opacity">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={CHART_MARGINS}>
                            <defs>
                                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...gridConfig} />
                            <XAxis
                                dataKey="name"
                                {...axisConfig}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                            />
                            <YAxis {...axisConfig} axisLine={false} />
                            <Tooltip
                                content={({ active, payload, label }) => (
                                    <ChartTooltip
                                        active={active}
                                        payload={payload?.map(p => ({
                                            name: "Enrollments",
                                            value: p.value as number,
                                            color: CHART_COLORS.primary,
                                            dataKey: p.dataKey as string,
                                            payload: p.payload as Record<string, unknown>
                                        }))}
                                        label={label}
                                        valueFormatter={(value) => `${value} students`}
                                    />
                                )}
                                cursor={verticalCursorStyle}
                            />
                            <Area
                                type="monotone"
                                dataKey="enrollments"
                                stroke={CHART_COLORS.primary}
                                strokeWidth={1.5}
                                fill="url(#enrollmentGradient)"
                                activeDot={{
                                    r: 4,
                                    strokeWidth: 2,
                                    fill: CHART_COLORS.background,
                                    stroke: CHART_COLORS.primary
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

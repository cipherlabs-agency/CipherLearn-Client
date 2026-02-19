"use client"

import { useState } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useGetMonthlyAttendanceTrendsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DurationFilter,
    DurationFilterDropdown,
    ChartTooltip,
    getDurationParams,
    CHART_COLORS,
    CHART_MARGINS,
    axisConfig,
    gridConfig,
    verticalCursorStyle,
} from "./chart-config"

interface AttendanceDataPoint {
    name: string
    present: number
    absent: number
    rate: number
}

export function AttendanceChart() {
    const [duration, setDuration] = useState<DurationFilter>("6months")
    const { months } = getDurationParams(duration)

    const { data: trends, isLoading, isFetching } = useGetMonthlyAttendanceTrendsQuery({ months })
    const isRefreshing = isFetching && !isLoading

    if (isLoading) {
        return (
            <div className="col-span-4 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
                <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-7 w-20" />
                    </div>
                </div>
                <div className="p-5">
                    <Skeleton className="h-[280px] w-full rounded" />
                </div>
            </div>
        )
    }

    const chartData: AttendanceDataPoint[] = trends?.map(t => ({
        name: t.date,
        present: t.present,
        absent: t.absent,
        rate: t.percentage
    })) || []

    const hasData = chartData.length > 0 && chartData.some(d => d.present > 0 || d.absent > 0)

    if (!hasData) {
        return (
            <div className="col-span-4 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
                <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[15px] font-bold text-foreground">Attendance Trends</h3>
                            <p className="text-[12.5px] text-muted-foreground mt-0.5">Monthly Overview</p>
                        </div>
                        <DurationFilterDropdown value={duration} onChange={setDuration} />
                    </div>
                </div>
                <div className="p-5">
                    <div className="h-[280px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-[15px] font-bold text-foreground">No Attendance Data</p>
                        <p className="text-xs text-muted-foreground mt-1">Mark attendance to see trends here</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="col-span-4 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
            <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[15px] font-bold text-foreground">Attendance Trends</h3>
                        <p className="text-[13.5px] text-muted-foreground mt-0.5">Monthly Overview</p>
                    </div>
                    <DurationFilterDropdown value={duration} onChange={setDuration} />
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
                        <BarChart data={chartData} margin={CHART_MARGINS}>
                            <CartesianGrid {...gridConfig} />
                            <XAxis dataKey="name" {...axisConfig} />
                            <YAxis {...axisConfig} axisLine={false} />
                            <Tooltip
                                content={({ active, payload, label }) => (
                                    <ChartTooltip
                                        active={active}
                                        payload={payload?.map(p => ({
                                            name: p.name as string,
                                            value: p.value as number,
                                            color: p.color as string,
                                            dataKey: p.dataKey as string,
                                            payload: p.payload as Record<string, unknown>
                                        }))}
                                        label={label}
                                        valueFormatter={(value) => value.toLocaleString()}
                                    />
                                )}
                                cursor={verticalCursorStyle}
                            />
                            <Bar
                                dataKey="present"
                                fill={CHART_COLORS.success}
                                radius={[3, 3, 0, 0]}
                                name="Present"
                            />
                            <Bar
                                dataKey="absent"
                                fill={CHART_COLORS.warning}
                                radius={[3, 3, 0, 0]}
                                name="Absent"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 pt-4 mt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
                        <span className="text-xs text-muted-foreground">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.warning }} />
                        <span className="text-xs text-muted-foreground">Absent</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

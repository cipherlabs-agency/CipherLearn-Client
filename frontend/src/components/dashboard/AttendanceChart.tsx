"use client"

import { BarChart3 } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useGetMonthlyAttendanceTrendsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"

export function AttendanceChart() {
    const { data: trends, isLoading, error } = useGetMonthlyAttendanceTrendsQuery({ months: 6 })
    if (isLoading) {
        return (
            <div className="col-span-4 rounded-lg border border-border bg-background">
                <div className="p-5 border-b border-border">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <div className="p-5">
                    <Skeleton className="h-[280px] w-full rounded" />
                </div>
            </div>
        )
    }

    const chartData = trends?.map(t => ({
        name: t.date,
        present: t.present,
        absent: t.absent,
        rate: t.percentage
    })) || []

    const hasData = chartData.length > 0 && chartData.some(d => d.present > 0 || d.absent > 0)

    if (!hasData) {
        return (
            <div className="col-span-4 rounded-lg border border-border bg-background">
                <div className="p-5 border-b border-border">
                    <h3 className="text-sm font-medium text-foreground">Attendance Trends</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Monthly Overview</p>
                </div>
                <div className="p-5">
                    <div className="h-[280px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No Attendance Data</p>
                        <p className="text-xs text-muted-foreground mt-1">Mark attendance to see trends here</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="col-span-4 rounded-lg border border-border bg-background">
            <div className="p-5 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Attendance Trends</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monthly Overview</p>
            </div>
            <div className="p-5">
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    padding: '8px 12px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                labelStyle={{ fontWeight: 500, marginBottom: '4px' }}
                            />
                            <Bar dataKey="present" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} name="Present" />
                            <Bar dataKey="absent" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} name="Absent" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 pt-4 mt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-muted-foreground">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-muted-foreground">Absent</span>
                    </div>
                </div>
            </div>
        </div>
    )
}


"use client"

import { UserPlus } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useGetEnrollmentTrendsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"

export function RevenueChart() {
    const { data: trends, isLoading, error } = useGetEnrollmentTrendsQuery({ months: 12 })
    if (isLoading) {
        return (
            <div className="col-span-8 rounded-lg border border-border bg-background">
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
        name: t.label,
        enrollments: t.count
    })) || []

    const totalEnrollments = chartData.reduce((sum, d) => sum + d.enrollments, 0)
    const hasData = totalEnrollments > 0

    if (!hasData) {
        return (
            <div className="col-span-8 rounded-lg border border-border bg-background">
                <div className="p-5 border-b border-border">
                    <h3 className="text-sm font-medium text-foreground">Enrollment Trends</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Monthly Growth Analysis</p>
                </div>
                <div className="p-5">
                    <div className="h-[280px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No Enrollment Data</p>
                        <p className="text-xs text-muted-foreground mt-1">Add students to see enrollment trends</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="col-span-8 rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                    <h3 className="text-sm font-medium text-foreground">Enrollment Trends</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Monthly Growth Analysis</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-semibold tracking-tight text-foreground">{totalEnrollments}</div>
                    <div className="text-[11px] text-muted-foreground">Total (12 months)</div>
                </div>
            </div>
            <div className="p-5">
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.1} />
                                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={50}
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
                                formatter={(value: number) => [`${value} students`, 'Enrollments']}
                            />
                            <Area
                                type="monotone"
                                dataKey="enrollments"
                                stroke="hsl(var(--foreground))"
                                strokeWidth={1.5}
                                fill="url(#enrollmentGradient)"
                                activeDot={{ r: 4, strokeWidth: 1.5, fill: 'hsl(var(--background))', stroke: 'hsl(var(--foreground))' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}


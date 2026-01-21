"use client"

import { UserPlus } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useGetEnrollmentTrendsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function RevenueChart() {
    const { data: trends, isLoading, error } = useGetEnrollmentTrendsQuery({ months: 12 })
    if (isLoading) {
        return (
            <Card className="col-span-8 h-[400px] border-border/60">
                <div className="space-y-4 p-6">
                    <Skeleton className="h-6 w-48 bg-muted/40" />
                    <Skeleton className="h-4 w-64 bg-muted/20" />
                    <Skeleton className="h-[280px] w-full bg-muted/30 rounded-md" />
                </div>
            </Card>
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
            <Card className="col-span-8 overflow-hidden group border-border/60">
                <div className="flex flex-col gap-1 p-6 border-b border-border/40">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Enrollment Trends</h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Monthly Growth Analysis</p>
                </div>
                <div className="p-6">
                    <div className="h-[300px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border/40 rounded-md bg-muted/5">
                        <div className="p-4 rounded-md bg-foreground/5 mb-4 border border-border/20">
                            <UserPlus className="h-6 w-6 text-foreground/40" />
                        </div>
                        <h3 className="text-sm font-semibold tracking-tight">No Enrollment Data</h3>
                        <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto mt-1 leading-relaxed">
                            Add students to see enrollment trends here.
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="col-span-8 overflow-hidden group border-border/60 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-border/40">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Enrollment Trends</h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Monthly Growth Analysis</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold tracking-tighter text-foreground">{totalEnrollments}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider opacity-60">Total (12 months)</div>
                </div>
            </div>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
                                tickLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    padding: '12px',
                                    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)',
                                    color: 'hsl(var(--foreground))'
                                }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [`${value} students`, 'Enrollments']}
                            />
                            <Area
                                type="monotone"
                                dataKey="enrollments"
                                stroke="hsl(var(--chart-primary))"
                                strokeWidth={2.5}
                                fill="url(#enrollmentGradient)"
                                activeDot={{ r: 5, strokeWidth: 2, fill: 'hsl(var(--background))', stroke: 'hsl(var(--chart-primary))' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}


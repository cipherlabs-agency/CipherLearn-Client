"use client"

import { BarChart3 } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useGetMonthlyAttendanceTrendsQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function AttendanceChart() {
    const { data: trends, isLoading, error } = useGetMonthlyAttendanceTrendsQuery({ months: 6 })
    if (isLoading) {
        return (
            <Card className="col-span-4 h-[400px] border-border/60">
                <div className="space-y-4 p-6">
                    <Skeleton className="h-6 w-48 bg-muted/40" />
                    <Skeleton className="h-4 w-64 bg-muted/20" />
                    <Skeleton className="h-[280px] w-full bg-muted/30 rounded-md" />
                </div>
            </Card>
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
            <Card className="col-span-4 overflow-hidden group border-border/60">
                <div className="flex flex-col gap-1 p-6 border-b border-border/40">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Attendance Trends</h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Monthly Overview</p>
                </div>
                <div className="p-6">
                    <div className="h-[300px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border/40 rounded-md bg-muted/5">
                        <div className="p-4 rounded-md bg-foreground/5 mb-4 border border-border/20">
                            <BarChart3 className="h-6 w-6 text-foreground/40" />
                        </div>
                        <h3 className="text-sm font-semibold tracking-tight">No Attendance Data</h3>
                        <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto mt-1 leading-relaxed">
                            Mark attendance to see trends here.
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="col-span-4 overflow-hidden group border-border/60 shadow-sm">
            <div className="flex flex-col gap-1 p-6 border-b border-border/40">
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Attendance Trends</h3>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Monthly Overview</p>
            </div>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--chart-success))" stopOpacity={1} />
                                    <stop offset="100%" stopColor="hsl(var(--chart-success))" stopOpacity={0.7} />
                                </linearGradient>
                                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--chart-warning))" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="hsl(var(--chart-warning))" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
                                tickLine={false}
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
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
                                    color: 'hsl(var(--foreground))'
                                }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'hsl(var(--foreground))' }}
                            />
                            <Bar dataKey="present" fill="url(#presentGradient)" radius={[4, 4, 0, 0]} name="Present" barSize={16} />
                            <Bar dataKey="absent" fill="url(#absentGradient)" radius={[4, 4, 0, 0]} name="Absent" barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 pt-6 border-t border-border/40 mt-6">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-success))' }} />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-warning))' }} />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Absent</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


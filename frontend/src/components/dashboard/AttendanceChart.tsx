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
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                                axisLine={{ stroke: 'var(--border)', opacity: 0.5 }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                                axisLine={{ stroke: 'var(--border)', opacity: 0.5 }}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--background)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    padding: '12px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}
                            />
                            <Bar dataKey="present" fill="var(--foreground)" radius={[2, 2, 0, 0]} name="Present" barSize={12} />
                            <Bar dataKey="absent" fill="var(--muted-foreground)" opacity={0.2} radius={[2, 2, 0, 0]} name="Absent" barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 pt-6 border-t border-border/40 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest opacity-60">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest opacity-60">Absent</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


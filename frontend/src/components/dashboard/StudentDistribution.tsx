"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useGetBatchDistributionQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const COLORS = ['hsl(var(--foreground))', 'hsl(var(--foreground) / 0.7)', 'hsl(var(--foreground) / 0.5)', 'hsl(var(--foreground) / 0.3)', 'hsl(var(--foreground) / 0.2)', 'hsl(var(--foreground) / 0.1)']

export function StudentDistribution() {
    const { data: distribution, isLoading } = useGetBatchDistributionQuery()

    if (isLoading) {
        return (
            <Card className="col-span-5 flex flex-col h-full border-border/60">
                <div className="space-y-4 p-6">
                    <Skeleton className="h-6 w-32 bg-muted/40" />
                    <Skeleton className="h-4 w-48 bg-muted/20" />
                    <Skeleton className="h-[280px] w-full bg-muted/30 rounded-full mx-auto aspect-square max-w-[200px]" />
                </div>
            </Card>
        )
    }

    const data = distribution?.map(d => ({
        name: d.batchName,
        value: d.studentCount
    })) || []

    const totalStudents = data.reduce((sum, d) => sum + d.value, 0)
    const hasData = totalStudents > 0

    if (!hasData) {
        return (
            <Card className="col-span-5 flex flex-col h-full border-border/60">
                <div className="flex flex-col gap-1 p-6 border-b border-border/40">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Distribution</h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Batch Allocation</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center p-6">
                    <div className="p-4 rounded-md bg-foreground/5 mb-4 border border-border/20">
                        <Users className="h-6 w-6 text-foreground/40" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">No Students Yet</h3>
                    <p className="text-[11px] text-muted-foreground max-w-[180px] mx-auto mt-1 leading-relaxed">
                        Add students to batches to see distribution metrics.
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="col-span-5 flex flex-col h-full border-border/60 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-border/40">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Distribution</h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Batch Allocation</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold tracking-tighter">{totalStudents}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider opacity-60">Total</div>
                </div>
            </div>

            <CardContent className="flex-1 py-6">
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                stroke="none"
                                outerRadius={80}
                                innerRadius={40}
                                dataKey="value"
                                paddingAngle={2}
                            >
                                {data.map((entry: any, index: number) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        className="stroke-background stroke-2"
                                    />
                                ))}
                            </Pie>
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
                                itemStyle={{ color: 'var(--foreground)' }}
                                cursor={{ fill: 'transparent' }}
                                formatter={(value: number, name: string) => [`${value} students`, name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-2 justify-center px-4 pt-4">
                    {data.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/10 border border-border/40">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground/80 tracking-tight">
                                {entry.name}
                            </span>
                            <span className="text-[10px] font-bold text-foreground">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

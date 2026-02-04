"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useGetBatchDistributionQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"

const COLORS = [
    'hsl(var(--foreground))',
    'hsl(var(--foreground) / 0.75)',
    'hsl(var(--foreground) / 0.55)',
    'hsl(var(--foreground) / 0.4)',
    'hsl(var(--foreground) / 0.25)',
    'hsl(var(--foreground) / 0.15)'
]

export function StudentDistribution() {
    const { data: distribution, isLoading } = useGetBatchDistributionQuery()

    if (isLoading) {
        return (
            <div className="col-span-5 rounded-lg border border-border bg-background flex flex-col h-full">
                <div className="p-5 border-b border-border">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex-1 p-5 flex items-center justify-center">
                    <Skeleton className="h-40 w-40 rounded-full" />
                </div>
            </div>
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
            <div className="col-span-5 rounded-lg border border-border bg-background flex flex-col h-full">
                <div className="p-5 border-b border-border">
                    <h3 className="text-sm font-medium text-foreground">Distribution</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Batch Allocation</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-5">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No Students Yet</p>
                    <p className="text-xs text-muted-foreground mt-1 text-center max-w-[180px]">
                        Add students to batches to see distribution
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="col-span-5 rounded-lg border border-border bg-background flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                    <h3 className="text-sm font-medium text-foreground">Distribution</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Batch Allocation</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-semibold tracking-tight">{totalStudents}</div>
                    <div className="text-[11px] text-muted-foreground">Total</div>
                </div>
            </div>

            <div className="flex-1 p-5">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={75}
                                innerRadius={45}
                                dataKey="value"
                                paddingAngle={2}
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                            >
                                {data.map((entry: { name: string; value: number }, index: number) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    padding: '8px 12px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: number, name: string) => [`${value} students`, name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-2 justify-center pt-4 border-t border-border mt-4">
                    {data.map((entry: { name: string; value: number }, index: number) => (
                        <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                            <span className="font-medium text-foreground">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

"use client"

import { Info, UserPlus, CalendarCheck } from "lucide-react"
import { useGetRecentActivitiesQuery } from "@/redux/slices/analytics/analyticsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"

export function ActivityFeed() {
    const { data: activities, isLoading, error } = useGetRecentActivitiesQuery({ limit: 10 })
    if (isLoading) {
        return (
            <Card className="col-span-7 h-[400px] border-border/60">
                <div className="space-y-6 p-6">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32 bg-muted/40" />
                        <Skeleton className="h-4 w-48 bg-muted/20" />
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start gap-4">
                            <Skeleton className="h-8 w-8 rounded-full bg-muted/30 shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-full bg-muted/20" />
                                <Skeleton className="h-3 w-24 bg-muted/10" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        )
    }

    const hasActivities = activities && activities.length > 0

    if (!hasActivities) {
        return (
            <Card className="col-span-7 overflow-hidden group border-border/60">
                <div className="flex flex-col gap-1 p-6 border-b border-border/40">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Activity Feed</h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Recent Operations</p>
                </div>
                <div className="flex flex-col items-center justify-center py-16 text-center px-8 p-6">
                    <div className="p-4 rounded-md bg-foreground/5 mb-4 border border-border/20">
                        <Info className="h-6 w-6 text-foreground/40" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">No Recent Activity</h3>
                    <p className="text-[11px] text-muted-foreground max-w-[220px] mx-auto mt-1 leading-relaxed">
                        Activities will appear here as students enroll and attendance is marked.
                    </p>
                </div>
            </Card>
        )
    }

    const formatTime = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
        } catch {
            return 'recently'
        }
    }

    return (
        <Card className="col-span-7 overflow-hidden border-border/60 shadow-sm">
            <div className="flex flex-col gap-1 p-6 border-b border-border/40">
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Activity Feed</h3>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Recent Operations</p>
            </div>
            <div className="max-h-[340px] overflow-y-auto">
                <div className="p-2 space-y-0.5">
                    {activities.map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors group/item"
                        >
                            <div className={`p-2 rounded-full shrink-0 border border-border/10 ${
                                activity.type === 'enrollment'
                                    ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-blue-500/5 text-blue-600 dark:text-blue-400'
                            }`}>
                                {activity.type === 'enrollment' ? (
                                    <UserPlus className="h-3.5 w-3.5" />
                                ) : (
                                    <CalendarCheck className="h-3.5 w-3.5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-foreground leading-relaxed truncate">
                                    {activity.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium opacity-60">
                                    {formatTime(activity.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}


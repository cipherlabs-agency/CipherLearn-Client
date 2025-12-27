"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Info } from "lucide-react"

export function ActivityFeed() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your institute.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Activity Feed Coming Soon</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        This feature will display real-time updates including student enrollments,
                        attendance records, and other important activities.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}


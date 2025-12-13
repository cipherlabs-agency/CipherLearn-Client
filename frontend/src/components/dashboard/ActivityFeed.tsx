"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ActivityFeed() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your institute.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="/avatars/01.png" alt="Avatar" />
                            <AvatarFallback>OM</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Olivia Martin paid fees</p>
                            <p className="text-sm text-muted-foreground">Physics Class 11 • ₹5,000</p>
                        </div>
                        <div className="ml-auto font-medium">+₹5,000</div>
                    </div>
                    <div className="flex items-center">
                        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                            <AvatarImage src="/avatars/02.png" alt="Avatar" />
                            <AvatarFallback>JL</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Jackson Lee joined</p>
                            <p className="text-sm text-muted-foreground">Math Class 10</p>
                        </div>
                        <div className="ml-auto font-medium">2 min ago</div>
                    </div>
                    <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="/avatars/03.png" alt="Avatar" />
                            <AvatarFallback>IN</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Isabella Nguyen absent</p>
                            <p className="text-sm text-muted-foreground">Chem Class 12</p>
                        </div>
                        <div className="ml-auto font-medium">1 hour ago</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

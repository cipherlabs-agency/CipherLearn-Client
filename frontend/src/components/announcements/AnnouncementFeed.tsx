"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pin, MoreHorizontal, Calendar, Loader2 } from "lucide-react"
import { useGetAnnouncementsQuery } from "@/redux/slices/announcements/announcementsApi"
import { Announcement } from "@/types"

export function AnnouncementFeed() {
    const { data: announcements, isLoading } = useGetAnnouncementsQuery({});

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-4">
            {announcements?.map((item: Announcement) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">{item.author[0]}</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    {item.author} • <Calendar className="mx-1 h-3 w-3" /> {item.dae}
                                </p>
                            </div>
                            {item.pinned && (
                                <Badge variant="secondary" className="gap-1">
                                    <Pin className="h-3 w-3" /> Pinned
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {item.content}
                        </p>
                    </div>
                    <div>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

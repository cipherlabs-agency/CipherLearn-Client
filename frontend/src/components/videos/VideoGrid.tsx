"use client"

import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
import { PlayCircle, Clock, Calendar, MoreVertical, Loader2 } from "lucide-react"
import { useGetVideosQuery } from "@/redux/slices/videos/videosApi"
import { Video } from "@/types"

export function VideoGrid() {
    const { data: videos, isLoading } = useGetVideosQuery({});

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {videos?.map((video: Video) => (
                <div key={video.id} className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                    <div className="aspect-video w-full bg-slate-900 relative flex items-center justify-center group-hover:bg-slate-800 transition-colors cursor-pointer">
                        <PlayCircle className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {video.duration}
                        </span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold leading-tight line-clamp-1">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{video.batch}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                            <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {video.date}
                            </span>
                            <span>{video.views} views</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

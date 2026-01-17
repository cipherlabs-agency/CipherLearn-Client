"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlayCircle, Calendar, MoreVertical, Loader2, Trash2, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetVideosQuery, useDeleteVideoMutation } from "@/redux/slices/videos/videosApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import type { YoutubeVideo, Batch } from "@/types"
import { toast } from "sonner"

interface VideoGridProps {
    batchId?: number
    searchQuery?: string
    isAdmin?: boolean
}

export function VideoGrid({ batchId, searchQuery, isAdmin = true }: VideoGridProps) {
    const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null)
    const [videoDialogOpen, setVideoDialogOpen] = useState(false)

    const { data: videosData, isLoading } = useGetVideosQuery({ batchId, search: searchQuery })
    const videos = videosData?.videos || []

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const [deleteVideo] = useDeleteVideoMutation()

    const getBatchName = (bId: number): string => {
        const batch = batches.find((b: Batch) => b.id === bId)
        return batch?.name || "Unknown Batch"
    }

    const extractYoutubeId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        return match ? match[1] : null
    }

    const getThumbnailUrl = (url: string) => {
        const videoId = extractYoutubeId(url)
        return videoId ? "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg" : null
    }

    const handlePlayVideo = (video: YoutubeVideo) => {
        setSelectedVideo(video)
        setVideoDialogOpen(true)
    }

    const handleDelete = async (videoId: number) => {
        if (!confirm("Are you sure you want to delete this video?")) return
        try {
            await deleteVideo(videoId).unwrap()
            toast.success("Video deleted successfully")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete video")
        }
    }

    if (isLoading) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-4">
                         <div className="aspect-video w-full rounded-md border border-border bg-muted/20 relative overflow-hidden">
                             <div className="absolute inset-0 skeleton-vercel opacity-20" />
                         </div>
                        <div className="space-y-2">
                             <Skeleton className="h-3.5 w-full bg-muted/40" />
                             <Skeleton className="h-2.5 w-2/3 bg-muted/20" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!videos || videos.length === 0) {
        return (
            <Card className="text-center py-32 border-dashed border-border/60 bg-muted/5 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Archive Empty</h3>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[280px] mx-auto font-medium leading-relaxed">No recorded lectures or technical sessions match your current filter parameters.</p>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video: YoutubeVideo) => {
                    const thumbnail = getThumbnailUrl(video.url)
                    return (
                        <div key={video.id} className="group flex flex-col h-full border-b border-transparent hover:border-border pb-6 transition-colors">
                            <div 
                                className="aspect-video w-full bg-black rounded-lg relative flex items-center justify-center cursor-pointer overflow-hidden border border-border group-hover:border-foreground/20 transition-all duration-300" 
                                onClick={() => handlePlayVideo(video)}
                            >
                                {thumbnail && (
                                    <img 
                                        src={thumbnail} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover opacity-60 contrast-125 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-foreground group-hover:text-background transition-all duration-300">
                                        <PlayCircle className="h-5 w-5" />
                                    </div>
                                </div>
                                {video.visibility !== "PUBLIC" && (
                                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-background/80 backdrop-blur-sm text-[8px] font-semibold tracking-widest uppercase border border-border">
                                        {video.visibility}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex flex-col flex-1">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <h3 className="font-semibold text-sm tracking-tight line-clamp-2 leading-snug group-hover:text-foreground transition-colors duration-200">
                                        {video.title}
                                    </h3>
                                    {isAdmin && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted/50"><MoreVertical className="h-3.5 w-3.5" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-background border border-border rounded-md p-1.5 w-48 shadow-2xl">
                                                    <DropdownMenuItem onClick={() => handlePlayVideo(video)} className="rounded-sm text-[10px] font-semibold uppercase tracking-widest py-2 cursor-pointer focus:bg-muted">Watch</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => window.open(video.url, "_blank")} className="rounded-sm text-[10px] font-semibold uppercase tracking-widest py-2 cursor-pointer focus:bg-muted">Source</DropdownMenuItem>
                                                    <div className="h-px bg-border my-1" />
                                                    <DropdownMenuItem onClick={() => handleDelete(video.id)} className="rounded-sm text-[10px] font-semibold uppercase tracking-widest py-2 cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Node {getBatchName(video.batchId)}</span>
                                        {video.category && <div className="text-[8px] font-semibold text-muted-foreground/40 uppercase tracking-tighter bg-muted/30 px-1.5 py-0.5 rounded-sm border border-border">{video.category}</div>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest pt-2.5 border-t border-border">
                                        <Calendar className="h-2.5 w-2.5" />
                                        {new Date(video.createdAt).toLocaleDateString("en-US", {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                <DialogContent className="sm:max-w-5xl p-0 overflow-hidden border border-border bg-background shadow-2xl">
                    <div className="flex flex-col">
                        <div className="aspect-video w-full bg-black relative">
                            {selectedVideo && (
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={"https://www.youtube.com/embed/" + extractYoutubeId(selectedVideo.url) + "?autoplay=1&rel=0&modestbranding=1"} 
                                    title={selectedVideo.title} 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen 
                                    className="contrast-110 grayscale-0 hover:grayscale-0 transition-all duration-700"
                                />
                            )}
                        </div>
                        <div className="p-8 border-t border-border">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="px-2 py-0.5 rounded-sm bg-foreground text-background text-[9px] font-semibold uppercase tracking-widest">Session_Archive</div>
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground opacity-60">Entry_ID • {selectedVideo?.id}</div>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tighter text-foreground mb-4">{selectedVideo?.title}</h2>
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-4xl">{selectedVideo?.description || "No technical breakdown provided for this session."}</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

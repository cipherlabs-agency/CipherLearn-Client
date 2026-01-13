"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useGetVideosQuery, useDeleteVideoMutation, YoutubeVideo } from "@/redux/slices/videos/videosApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
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

    const { data: batchesData } = useGetAllBatchesQuery({})
    const batches = batchesData?.data || []

    const [deleteVideo] = useDeleteVideoMutation()

    const getBatchName = (bId: number) => {
        const batch = batches.find((b: any) => b.id === bId)
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
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <PlayCircle className="h-12 w-12 mb-4 opacity-50" />
                <p>No videos found</p>
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video: YoutubeVideo) => {
                    const thumbnail = getThumbnailUrl(video.url)
                    return (
                        <div key={video.id} className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                            <div className="aspect-video w-full bg-slate-900 relative flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => handlePlayVideo(video)}>
                                {thumbnail && <img src={thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <PlayCircle className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {video.visibility !== "PUBLIC" && <Badge variant="secondary" className="absolute top-2 left-2">{video.visibility}</Badge>}
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold leading-tight line-clamp-2">{video.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">{getBatchName(video.batchId)}</p>
                                    </div>
                                    {isAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handlePlayVideo(video)}><PlayCircle className="mr-2 h-4 w-4" />Play</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(video.url, "_blank")}><ExternalLink className="mr-2 h-4 w-4" />Open on YouTube</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(video.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                                    <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" />{new Date(video.createdAt).toLocaleDateString()}</span>
                                    {video.category && <Badge variant="outline" className="text-xs">{video.category}</Badge>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                <DialogContent className="sm:max-w-[800px] p-0">
                    <DialogHeader className="p-4 pb-0"><DialogTitle>{selectedVideo?.title}</DialogTitle></DialogHeader>
                    <div className="aspect-video w-full">
                        {selectedVideo && <iframe width="100%" height="100%" src={"https://www.youtube.com/embed/" + extractYoutubeId(selectedVideo.url) + "?autoplay=1"} title={selectedVideo.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
                    </div>
                    {selectedVideo?.description && <div className="p-4 pt-0"><p className="text-sm text-muted-foreground">{selectedVideo.description}</p></div>}
                </DialogContent>
            </Dialog>
        </>
    )
}

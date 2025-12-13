"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, Filter, PlayCircle } from "lucide-react"
import { VideoGrid } from "@/components/videos/VideoGrid"

export default function VideosPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Video Lectures</h1>
                    <p className="text-muted-foreground">Upload and manage recorded sessions.</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700">
                    <Upload className="mr-2 h-4 w-4" /> Upload Video
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search lectures..."
                        className="pl-8 bg-background"
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <VideoGrid />
        </div>
    )
}

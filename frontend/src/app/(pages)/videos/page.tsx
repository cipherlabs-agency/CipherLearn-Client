"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { VideoGrid } from "@/components/videos/VideoGrid"
import { AddVideoDialog } from "@/components/videos/AddVideoDialog"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"

export default function VideosPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(undefined)
    
    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === "ADMIN" || user?.role === "TEACHER"

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    return (
        <div className="space-y-10 py-8 px-6 max-w-[1400px] mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-border/40 pb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Video Lectures
                    </h1>
                    <p className="text-muted-vercel mt-2">Archives of technical sessions, architecture deep-dives, and academic recordings.</p>
                </div>
                {isAdmin && <AddVideoDialog />}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <input 
                        type="search" 
                        placeholder="Search archives for lecture nodes..." 
                        className="w-full h-10 pl-10 pr-4 bg-muted/30 border border-border/50 rounded-md text-xs font-medium focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
                <div className="h-6 w-px bg-border/40 hidden sm:block mx-2" />
                <select 
                    className="h-10 w-full sm:w-64 bg-muted/30 border border-border/50 rounded-md px-3 text-xs font-black uppercase tracking-wider focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none appearance-none cursor-pointer" 
                    value={selectedBatchId || ""} 
                    onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="" className="bg-background text-foreground lowercase">All academic nodes</option>
                    {batches.map((batch) => (<option key={batch.id} value={batch.id} className="bg-background text-foreground lowercase">{batch.name}</option>))}
                </select>
            </div>

            <div className="min-h-[400px]">
                <VideoGrid batchId={selectedBatchId} searchQuery={searchQuery} isAdmin={isAdmin} />
            </div>
        </div>
    )
}

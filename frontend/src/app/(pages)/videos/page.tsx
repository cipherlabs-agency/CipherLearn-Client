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

    const { data: batchesData } = useGetAllBatchesQuery({})
    const batches = batchesData?.data || []

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Video Lectures</h1>
                    <p className="text-muted-foreground">Watch recorded sessions and tutorials.</p>
                </div>
                {isAdmin && <AddVideoDialog />}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search videos..." className="pl-8 bg-background" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <select className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedBatchId || ""} onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : undefined)}>
                    <option value="">All Batches</option>
                    {batches.map((batch: any) => (<option key={batch.id} value={batch.id}>{batch.name}</option>))}
                </select>
            </div>

            <VideoGrid batchId={selectedBatchId} searchQuery={searchQuery} isAdmin={isAdmin} />
        </div>
    )
}

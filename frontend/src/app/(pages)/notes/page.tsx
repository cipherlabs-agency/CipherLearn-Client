"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { NotesList } from "@/components/notes/NotesList"
import { AddNoteDialog } from "@/components/notes/AddNoteDialog"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"

export default function NotesPage() {
    const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(undefined)

    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === "ADMIN" || user?.role === "TEACHER"

    const { data: batchesData } = useGetAllBatchesQuery();
    const batches = batchesData || [];

    return (
        <div className="space-y-10 py-8 px-6 max-w-[1400px] mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-border/40 pb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Study Material
                    </h1>
                    <p className="text-muted-vercel mt-2">Curated notes, assignments, and architectural documentation for academic cycles.</p>
                </div>
                {isAdmin && <AddNoteDialog />}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Academic Filter</label>
                    <div className="relative group">
                        <select 
                            className="h-10 w-full sm:w-72 bg-muted/30 border border-border/50 rounded-md px-3 text-xs font-black uppercase tracking-wider focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none appearance-none cursor-pointer" 
                            value={selectedBatchId || ""} 
                            onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="" className="bg-background text-foreground lowercase">All academic nodes</option>
                            {batches.map((batch) => (<option key={batch.id} value={batch.id} className="bg-background text-foreground lowercase">{batch.name}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card-vercel !px-0 !py-0 border-border/40 overflow-hidden">
                <NotesList batchId={selectedBatchId} isAdmin={isAdmin} />
            </div>
        </div>
    )
}

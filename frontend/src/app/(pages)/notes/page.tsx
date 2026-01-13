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

    const { data: batchesData } = useGetAllBatchesQuery({})
    const batches = batchesData?.data || []

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Study Material</h1>
                    <p className="text-muted-foreground">Access notes, assignments, and documents.</p>
                </div>
                {isAdmin && <AddNoteDialog />}
            </div>

            <div className="flex items-center gap-4">
                <select className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedBatchId || ""} onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : undefined)}>
                    <option value="">All Batches</option>
                    {batches.map((batch: any) => (<option key={batch.id} value={batch.id}>{batch.name}</option>))}
                </select>
            </div>

            <NotesList batchId={selectedBatchId} isAdmin={isAdmin} />
        </div>
    )
}

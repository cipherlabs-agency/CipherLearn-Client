"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
    FileText, 
    Download, 
    Trash2, 
    Loader2, 
    ExternalLink, 
    Eye,
    Calendar 
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetNotesQuery, useDeleteNoteMutation } from "@/redux/slices/notes/notesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import type { Note, Batch } from "@/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { AddNoteDialog } from "./AddNoteDialog"

interface NotesListProps {
    batchId?: number
    isAdmin?: boolean
}

export function NotesList({ batchId, isAdmin = true }: NotesListProps) {
    const { data: notesData, isLoading } = useGetNotesQuery({ batchId })
    const notes = notesData?.notes || []

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation()

    const getBatchName = (bId: number): string => {
        const batch = batches.find((b: Batch) => b.id === bId)
        return batch?.name || "Unknown Batch"
    }

    const handleDelete = async (noteId: number) => {
        if (!confirm("Are you sure you want to delete this note?")) return
        try {
            await deleteNote(noteId).unwrap()
            toast.success("Note deleted successfully")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete note")
        }
    }

    const handleDownload = (note: Note) => {
        if (note.content && note.content.length > 0) {
            window.open(note.content[0], "_blank")
        }
    }

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="border-b border-border bg-muted/5 px-8 py-4">
                    <div className="grid grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-3 w-20 bg-muted/40" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="px-8 py-5 border-b border-border flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="h-8 w-8 rounded-md bg-muted/30" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-4 w-48 bg-muted/20" />
                                <Skeleton className="h-3 w-12 bg-muted/10" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-32 bg-muted/20" />
                        <Skeleton className="h-3 w-20 bg-muted/20" />
                        <Skeleton className="h-3 w-24 bg-muted/20" />
                        <Skeleton className="h-8 w-8 bg-muted/40 rounded-md" />
                    </div>
                ))}
            </div>
        )
    }

    if (!notes || notes.length === 0) {
        return (
            <Card className="text-center py-24 border-dashed border-border/60 bg-muted/5 m-8 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Library Null</h3>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[260px] mx-auto font-medium leading-relaxed">No study materials or technical documentation have been deployed to this sector yet.</p>
                {isAdmin && (
                    <div className="mt-10">
                         <AddNoteDialog />
                    </div>
                )}
            </Card>
        )
    }

    return (
        <Table>
            <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="w-[350px] text-[10px] font-semibold uppercase tracking-widest py-4 pl-8 text-muted-foreground">Resource</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Node Group</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Deployed</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold uppercase tracking-widest py-4 pr-10 text-muted-foreground">Access</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {notes.map((note: Note) => (
                    <TableRow key={note.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-5 pl-8">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm tracking-tight leading-none text-foreground">{note.title}</span>
                                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-1 opacity-60">MDX • {note.category || "General"}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-muted/30 w-fit uppercase tracking-tighter text-muted-foreground">
                                {getBatchName(note.batchId)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-semibold uppercase tracking-widest">Available</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-xs lowercase tracking-tighter tabular-nums">
                            {new Date(note.createdAt).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </TableCell>
                        <TableCell className="text-right pr-10">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                {note.content && note.content.length > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDownload(note)}
                                        className="h-8 w-8 rounded-md hover:bg-muted/50 hover:text-foreground"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-md hover:bg-muted/50 hover:text-foreground"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDelete(note.id)} 
                                        disabled={isDeleting}
                                        className="h-8 w-8 rounded-md hover:bg-rose-500/5 hover:text-rose-500"
                                    >
                                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

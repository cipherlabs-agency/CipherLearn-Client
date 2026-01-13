"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Trash2, Loader2, ExternalLink, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetNotesQuery, useDeleteNoteMutation, Note } from "@/redux/slices/notes/notesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"

interface NotesListProps {
    batchId?: number
    isAdmin?: boolean
}

export function NotesList({ batchId, isAdmin = true }: NotesListProps) {
    const { data: notesData, isLoading } = useGetNotesQuery({ batchId })
    const notes = notesData?.notes || []

    const { data: batchesData } = useGetAllBatchesQuery({})
    const batches = batchesData?.data || []

    const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation()

    const getBatchName = (bId: number) => {
        const batch = batches.find((b: any) => b.id === bId)
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
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (!notes || notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>No notes found</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notes.map((note: Note) => (
                        <TableRow key={note.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">{note.title}</span>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{getBatchName(note.batchId)}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{note.category || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {note.content && note.content.length > 0 && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDownload(note)}>
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    )}
                                    {isAdmin && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)} disabled={isDeleting}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

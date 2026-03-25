"use client"

import { useState } from "react"
import { Upload, Loader2, BookOpen, Layers, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/ui/file-upload"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useUploadNoteMutation } from "@/redux/slices/notes/notesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AddNoteDialog() {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({ title: "", category: "", batchId: "" })

    const { data: batchesData = [] } = useGetAllBatchesQuery()
    const batches = batchesData

    const [uploadNote, { isLoading }] = useUploadNoteMutation()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const resetForm = () => {
        setFormData({ title: "", category: "", batchId: "" })
        setFiles([])
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) setTimeout(resetForm, 300)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title || !formData.batchId) {
            toast.error("Please fill in all required fields")
            return
        }

        const data = new FormData()
        data.append("title", formData.title)
        data.append("batchId", formData.batchId)
        if (formData.category) data.append("category", formData.category)
        files.forEach((file) => data.append("files", file))

        try {
            await uploadNote(data).unwrap()
            toast.success("Study material uploaded successfully")
            resetForm()
            setOpen(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to upload study material")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 shadow-sm">
                    <Upload className="h-4 w-4" />
                    Upload Material
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Add Note</DialogTitle></VisuallyHidden>
                <form onSubmit={handleSubmit} className="flex flex-col h-[700px]">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border/50 bg-muted/10 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">
                                    Upload Study Material
                                </h2>
                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                    Share PDFs, notes, or handouts with your students
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 custom-scrollbar">
                        {/* Batch Selection */}
                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Assign to Batch <span className="text-destructive">*</span>
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                {batches.map((batch) => (
                                    <button
                                        key={batch.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, batchId: String(batch.id) })}
                                        className={cn(
                                            "flex items-center justify-center p-3 rounded-xl border transition-all duration-200 text-center",
                                            formData.batchId === String(batch.id)
                                                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[13px] font-semibold truncate px-1",
                                            formData.batchId === String(batch.id) ? "text-primary" : "text-foreground"
                                        )}>
                                            {batch.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {batches.length === 0 && (
                                <div className="text-[13px] text-muted-foreground p-4 rounded-xl border border-dashed text-center bg-muted/30">
                                    No batches available. Please create a batch first.
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                Material Details
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="title" className="text-[12px] font-semibold text-foreground">
                                        Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Chapter 4 - Quadratic Equations"
                                        className="h-11 text-[14px] bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="category" className="text-[12px] font-semibold text-foreground">
                                        Category <em>(Optional)</em>
                                    </Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        placeholder="e.g. Worksheet, Notes"
                                        className="h-11 text-[14px] bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Upload className="h-3.5 w-3.5" />
                                Attach Files
                            </Label>
                            <div className={cn(
                                "rounded-xl border-2 transition-all duration-200 overflow-hidden",
                                files.length > 0 ? "border-primary/30 bg-primary/5" : "border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5"
                            )}>
                                <FileUpload
                                    files={files}
                                    onChange={setFiles}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    maxFiles={5}
                                    maxSize={10 * 1024 * 1024}
                                    label="Drop files here or click to browse"
                                    hint="PDF, Word, or PowerPoint (Max 10MB)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-border bg-card flex items-center justify-between shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="h-10 px-5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.batchId || !formData.title || files.length === 0}
                            className="h-10 px-6 text-[13px] font-medium shadow-sm min-w-[140px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload Material"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

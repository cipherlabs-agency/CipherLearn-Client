"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, FileText, X } from "lucide-react"
import { useUploadNoteMutation } from "@/redux/slices/notes/notesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"

export function AddNoteDialog() {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({ title: "", category: "", batchId: "" })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []
    const [uploadNote, { isLoading }] = useUploadNoteMutation()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
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
            toast.success("Note uploaded successfully")
            setOpen(false)
            setFormData({ title: "", category: "", batchId: "" })
            setFiles([])
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to upload note")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Upload Study Material</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Upload PDFs, documents, or other files for students.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-[13px] font-medium">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter document title"
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="batchId" className="text-[13px] font-medium">
                                    Batch <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="batchId"
                                    value={formData.batchId}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    required
                                >
                                    <option value="">Select batch...</option>
                                    {batches.map((batch: { id: number; name: string }) => (
                                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="category" className="text-[13px] font-medium">Category</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="e.g., Notes"
                                    className="h-9 text-[13px]"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">Files</Label>
                            <div
                                className="border border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileText className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-[13px] text-muted-foreground">Click to upload or drag and drop</p>
                                <p className="text-[11px] text-muted-foreground/70 mt-1">PDF, DOC, DOCX, PPT, PPTX (max 10MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {files.length > 0 && (
                                <div className="space-y-1.5 mt-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md border border-border">
                                            <span className="text-[13px] truncate flex-1 mr-2">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0"
                                                onClick={() => removeFile(index)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-8 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-[13px] min-w-[90px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

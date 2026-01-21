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
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to upload note")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Upload className="mr-2 h-4 w-4" />Upload File</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Study Material</DialogTitle>
                    <DialogDescription>Upload PDFs, documents, or other files for students.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={formData.title} onChange={handleChange} placeholder="Enter document title" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="batchId">Batch *</Label>
                                <select id="batchId" className="w-full input-industrial rounded-md text-sm" value={formData.batchId} onChange={handleChange} required>
                                    <option value="">Select batch...</option>
                                    {batches.map((batch: any) => (<option key={batch.id} value={batch.id}>{batch.name}</option>))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" value={formData.category} onChange={handleChange} placeholder="e.g., Notes, Assignment" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Files</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, PPT, PPTX (max 10MB)</p>
                                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleFileChange} />
                            </div>
                            {files.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                            <span className="text-sm truncate">{file.name}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>) : "Upload"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useState, useRef } from "react"
import { Plus, Upload, X, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCreateStudyMaterialMutation } from "@/redux/slices/studyMaterials/studyMaterialsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"

export function AddStudyMaterialDialog() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [batchId, setBatchId] = useState<string>("")
    const [category, setCategory] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const [createMaterial, { isLoading }] = useCreateStudyMaterialMutation()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        setFiles((prev) => [...prev, ...selectedFiles])
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setBatchId("")
        setCategory("")
        setFiles([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !batchId || files.length === 0) {
            return
        }

        const formData = new FormData()
        formData.append("title", title)
        formData.append("batchId", batchId)
        if (description) formData.append("description", description)
        if (category) formData.append("category", category)
        files.forEach((file) => {
            formData.append("files", file)
        })

        try {
            await createMaterial(formData).unwrap()
            resetForm()
            setOpen(false)
        } catch (err) {
            console.error("Failed to create study material:", err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Add Study Material</DialogTitle>
                    <DialogDescription>
                        Upload documents, PDFs, or other resources for students.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter material title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="batch">Batch *</Label>
                        <Select value={batchId} onValueChange={setBatchId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a batch" />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id.toString()}>
                                        {batch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Notes, Assignments, Slides"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the material"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Files *</Label>
                        <div
                            className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-foreground/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF, DOC, DOCX, PPT, PPTX, Images
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                            />
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-2 mt-3">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm truncate">{file.name}</span>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                ({(file.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !title || !batchId || files.length === 0}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload Material"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

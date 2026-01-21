"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, FileText, Loader2, ExternalLink } from "lucide-react"
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
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    useUpdateStudyMaterialMutation,
    StudyMaterial,
} from "@/redux/slices/studyMaterials/studyMaterialsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"

interface EditStudyMaterialDialogProps {
    material: StudyMaterial
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditStudyMaterialDialog({
    material,
    open,
    onOpenChange,
}: EditStudyMaterialDialogProps) {
    const [title, setTitle] = useState(material.title)
    const [description, setDescription] = useState(material.description || "")
    const [batchId, setBatchId] = useState(material.batchId.toString())
    const [category, setCategory] = useState(material.category || "")
    const [existingFiles, setExistingFiles] = useState<string[]>(material.files as string[])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const [updateMaterial, { isLoading }] = useUpdateStudyMaterialMutation()

    // Reset form when material changes
    useEffect(() => {
        setTitle(material.title)
        setDescription(material.description || "")
        setBatchId(material.batchId.toString())
        setCategory(material.category || "")
        setExistingFiles(material.files as string[])
        setNewFiles([])
    }, [material])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        setNewFiles((prev) => [...prev, ...selectedFiles])
    }

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const removeExistingFile = (filepath: string) => {
        setExistingFiles((prev) => prev.filter((f) => f !== filepath))
    }

    const getFileName = (filepath: string) => {
        return filepath.split("/").pop() || filepath
    }

    const getFileUrl = (filepath: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""
        return `${baseUrl}${filepath}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !batchId) {
            return
        }

        const formData = new FormData()
        formData.append("title", title)
        formData.append("batchId", batchId)
        if (description) formData.append("description", description)
        if (category) formData.append("category", category)

        // Send existing files to keep
        formData.append("existingFiles", JSON.stringify(existingFiles))

        // Add new files
        newFiles.forEach((file) => {
            formData.append("files", file)
        })

        try {
            await updateMaterial({ id: material.id, formData }).unwrap()
            onOpenChange(false)
        } catch (err) {
            console.error("Failed to update study material:", err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Edit Study Material</DialogTitle>
                    <DialogDescription>
                        Update the study material details and files.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Title *</Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter material title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-batch">Batch *</Label>
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
                        <Label htmlFor="edit-category">Category</Label>
                        <Input
                            id="edit-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Notes, Assignments, Slides"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the material"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Files</Label>

                        {/* Existing Files */}
                        {existingFiles.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Current files:</p>
                                {existingFiles.map((filepath, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            <a
                                                href={getFileUrl(filepath)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm truncate hover:underline flex items-center gap-1"
                                            >
                                                {getFileName(filepath)}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                            onClick={() => removeExistingFile(filepath)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Files Upload */}
                        <div
                            className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center cursor-pointer hover:border-foreground/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Click to add more files
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

                        {/* New Files Preview */}
                        {newFiles.length > 0 && (
                            <div className="space-y-2 mt-3">
                                <p className="text-xs text-muted-foreground">New files to upload:</p>
                                {newFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-md"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
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
                                            onClick={() => removeNewFile(index)}
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
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !title || !batchId || (existingFiles.length === 0 && newFiles.length === 0)}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

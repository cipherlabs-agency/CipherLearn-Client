"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2 } from "lucide-react"
import { useUploadVideoMutation } from "@/redux/slices/videos/videosApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"

export function AddVideoDialog() {
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        url: "",
        visibility: "PUBLIC" as "PUBLIC" | "PRIVATE" | "UNLISTED",
        category: "",
        batchId: ""
    })

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []
    const [uploadVideo, { isLoading }] = useUploadVideoMutation()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title || !formData.url || !formData.batchId) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            await uploadVideo({
                title: formData.title,
                description: formData.description,
                url: formData.url,
                visibility: formData.visibility,
                category: formData.category,
                batchId: Number(formData.batchId)
            }).unwrap()

            toast.success("Video added successfully")
            setOpen(false)
            setFormData({ title: "", description: "", url: "", visibility: "PUBLIC", category: "", batchId: "" })
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to add video")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Add Video</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Add YouTube Video</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Add a YouTube video for students to watch.
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
                                placeholder="Enter video title"
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="url" className="text-[13px] font-medium">
                                YouTube URL <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="url"
                                value={formData.url}
                                onChange={handleChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-[13px] font-medium">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter video description"
                                rows={3}
                                className="text-[13px] resize-none"
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
                                <Label htmlFor="visibility" className="text-[13px] font-medium">Visibility</Label>
                                <select
                                    id="visibility"
                                    value={formData.visibility}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="PUBLIC">Public</option>
                                    <option value="PRIVATE">Private</option>
                                    <option value="UNLISTED">Unlisted</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-[13px] font-medium">Category</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g., Lecture, Tutorial"
                                className="h-9 text-[13px]"
                            />
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
                                    Adding...
                                </>
                            ) : (
                                "Add Video"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

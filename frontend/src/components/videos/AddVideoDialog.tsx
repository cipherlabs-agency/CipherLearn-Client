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
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to add video")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Upload className="mr-2 h-4 w-4" />Add Video</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add YouTube Video</DialogTitle>
                    <DialogDescription>Add a YouTube video for students to watch.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={formData.title} onChange={handleChange} placeholder="Enter video title" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">YouTube URL *</Label>
                            <Input id="url" value={formData.url} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description} onChange={handleChange} placeholder="Enter video description" rows={3} />
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
                                <Label htmlFor="visibility">Visibility</Label>
                                <select id="visibility" className="w-full input-industrial rounded-md text-sm" value={formData.visibility} onChange={handleChange}>
                                    <option value="PUBLIC">Public</option>
                                    <option value="PRIVATE">Private</option>
                                    <option value="UNLISTED">Unlisted</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" value={formData.category} onChange={handleChange} placeholder="e.g., Lecture, Tutorial" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>) : "Add Video"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

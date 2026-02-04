"use client"

import { useState } from "react"
import { Plus, Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useCreateAnnouncementMutation, AnnouncementPriority } from "@/redux/slices/announcements/announcementsApi"

export function AddAnnouncementDialog() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL")
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const [createAnnouncement, { isLoading }] = useCreateAnnouncementMutation()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImage(null)
        setImagePreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append("title", title)
        formData.append("description", description)
        formData.append("priority", priority)
        if (image) {
            formData.append("image", image)
        }

        try {
            await createAnnouncement(formData).unwrap()
            setOpen(false)
            resetForm()
        } catch (err) {
            console.error("Failed to create announcement:", err)
        }
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setPriority("NORMAL")
        setImage(null)
        setImagePreview(null)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Announcement</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Create Announcement</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Create a new announcement for students.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter announcement title"
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">
                                Description <span className="text-destructive">*</span>
                            </Label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter announcement details"
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">Priority</Label>
                            <Select value={priority} onValueChange={(val) => setPriority(val as AnnouncementPriority)}>
                                <SelectTrigger className="h-9 text-[13px]">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW" className="text-[13px]">Low</SelectItem>
                                    <SelectItem value="NORMAL" className="text-[13px]">Normal</SelectItem>
                                    <SelectItem value="HIGH" className="text-[13px]">High</SelectItem>
                                    <SelectItem value="URGENT" className="text-[13px]">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">Image (Optional)</Label>
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-32 object-cover rounded-md border border-border"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 h-7 w-7 bg-background/90 hover:bg-background"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1.5" />
                                    <span className="text-[13px] text-muted-foreground">Click to upload image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
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
                                    Creating...
                                </>
                            ) : (
                                "Create"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

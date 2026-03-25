"use client"

import { useState, useRef } from "react"
import { Megaphone, Plus, Upload, X, Loader2, ArrowDownCircle, Info, AlertCircle, AlertTriangle, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useCreateAnnouncementMutation, AnnouncementPriority } from "@/redux/slices/announcements/announcementsApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PRIORITY_OPTIONS = [
    { value: "LOW", label: "Low", icon: ArrowDownCircle, colorClass: "text-green-500", borderClass: "border-green-500/30", bgClass: "bg-green-500/10" },
    { value: "NORMAL", label: "Normal", icon: Info, colorClass: "text-blue-500", borderClass: "border-blue-500/30", bgClass: "bg-blue-500/10" },
    { value: "HIGH", label: "High", icon: AlertCircle, colorClass: "text-orange-500", borderClass: "border-orange-500/30", bgClass: "bg-orange-500/10" },
    { value: "URGENT", label: "Urgent", icon: AlertTriangle, colorClass: "text-red-500", borderClass: "border-red-500/30", bgClass: "bg-red-500/10" },
]

export function AddAnnouncementDialog() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL")
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [createAnnouncement, { isLoading }] = useCreateAnnouncementMutation()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        processFile(file)
    }

    const processFile = (file?: File) => {
        if (file && file.type.startsWith("image/")) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        processFile(file)
    }

    const removeImage = () => {
        setImage(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setPriority("NORMAL")
        setImage(null)
        setImagePreview(null)
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) setTimeout(resetForm, 300)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !description) {
            toast.error("Please fill in all required fields")
            return
        }

        const formData = new FormData()
        formData.append("title", title.trim())
        formData.append("description", description.trim())
        formData.append("priority", priority)
        if (image) {
            formData.append("image", image)
        }

        try {
            await createAnnouncement(formData).unwrap()
            toast.success("Announcement published successfully")
            resetForm()
            setOpen(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to create announcement")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 shadow-sm">
                    <Megaphone className="h-4 w-4" />
                    New Announcement
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[850px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Add Announcement</DialogTitle></VisuallyHidden>
                <form onSubmit={handleSubmit} className="flex flex-col h-[720px]">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border/50 bg-primary/5 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                                <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">
                                    Broadcast Announcement
                                </h2>
                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                    Share important news, updates, or alerts with everyone
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        {/* Left Side: Details & Priority */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                            <div className="space-y-4">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Priority Level
                                </Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    {PRIORITY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setPriority(opt.value as AnnouncementPriority)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 text-center gap-1.5",
                                                priority === opt.value
                                                    ? cn(opt.borderClass, opt.bgClass, "shadow-sm")
                                                    : "border-border bg-card hover:bg-muted/50"
                                            )}
                                        >
                                            <opt.icon className={cn(
                                                "h-4 w-4 shrink-0",
                                                priority === opt.value ? opt.colorClass : "text-muted-foreground"
                                            )} />
                                            <span className={cn(
                                                "text-[12px] font-bold",
                                                priority === opt.value ? opt.colorClass : "text-foreground"
                                            )}>
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5" />
                                    Message Details
                                </Label>
                                <div className="space-y-1.5">
                                    <Label htmlFor="title" className="text-[12px] font-semibold text-foreground">
                                        Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Upcoming Holiday Schedule"
                                        className="h-11 text-[14px] bg-background shadow-sm transition-all focus-visible:ring-indigo-500/50 font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="description" className="text-[12px] font-semibold text-foreground">
                                        Message Content <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Write your announcement message here..."
                                        rows={8}
                                        className="text-[14px] resize-none bg-background shadow-sm transition-all focus-visible:ring-indigo-500/50 p-3 leading-relaxed"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Image Upload */}
                        <div className="md:w-[320px] bg-muted/10 border-l border-border p-6 md:p-8 flex flex-col">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                                <ImageIcon className="h-3.5 w-3.5" />
                                Featured Image
                            </Label>
                            
                            <div className="flex-1 flex flex-col">
                                {imagePreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-border shadow-sm group bg-black/5 flex-1">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={removeImage}
                                                className="shadow-xl"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Remove Image
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label 
                                        className={cn(
                                            "flex flex-col items-center justify-center flex-1 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                                            isDragging ? "border-indigo-500 bg-indigo-500/5 scale-[1.02]" : "border-border/60 hover:border-indigo-500/50 hover:bg-indigo-500/5 bg-background"
                                        )}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="h-14 w-14 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <span className="text-[14px] font-semibold text-foreground mb-1">Upload an image</span>
                                        <span className="text-[12px] text-muted-foreground text-center px-4">
                                            Drag and drop your file here, or click to browse
                                        </span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="mt-4 text-[11px] text-muted-foreground text-center">
                                Adding an image makes your announcement stand out more. Optional but recommended.
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
                            disabled={isLoading || !title || !description}
                            className="h-10 px-8 text-[13px] font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white border-0 min-w-[160px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Broadcasting...
                                </>
                            ) : (
                                "Broadcast Announcement"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

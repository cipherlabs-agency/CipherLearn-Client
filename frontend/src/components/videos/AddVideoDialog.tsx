"use client"

import { useState, useMemo } from "react"
import { Play, Globe, Lock, EyeOff, Loader2, Youtube, Users, AlignLeft, Info } from "lucide-react"
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
import { useUploadVideoMutation } from "@/redux/slices/videos/videosApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const VISIBILITY_OPTIONS = [
    { value: "PUBLIC", label: "Public", icon: Globe, description: "Anyone can watch" },
    { value: "UNLISTED", label: "Unlisted", icon: EyeOff, description: "Only with link" },
    { value: "PRIVATE", label: "Private", icon: Lock, description: "Only enrolled" },
]

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

    const { data: batchesData = [] } = useGetAllBatchesQuery()
    const batches = batchesData

    const [uploadVideo, { isLoading }] = useUploadVideoMutation()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const resetForm = () => {
        setFormData({ title: "", description: "", url: "", visibility: "PUBLIC", category: "", batchId: "" })
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) setTimeout(resetForm, 300)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title || !formData.url || !formData.batchId) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            await uploadVideo({
                title: formData.title.trim(),
                description: formData.description.trim(),
                url: formData.url.trim(),
                visibility: formData.visibility,
                category: formData.category.trim(),
                batchId: Number(formData.batchId)
            }).unwrap()

            toast.success("Video added successfully")
            resetForm()
            setOpen(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to add video")
        }
    }

    // Extract YouTube ID for thumbnail preview
    const videoId = useMemo(() => {
        if (!formData.url) return null
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = formData.url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }, [formData.url])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 shadow-sm">
                    <Play className="h-4 w-4" />
                    Add Video
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[900px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Add Video</DialogTitle></VisuallyHidden>
                <form onSubmit={handleSubmit} className="flex flex-col h-[750px]">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border/50 bg-red-500/5 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                                <Youtube className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">
                                    Add YouTube Video
                                </h2>
                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                    Embed an educational video directly into the platform
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        {/* Left side: Preview & URL */}
                        <div className="md:w-[320px] p-6 md:p-8 border-r border-border bg-muted/10 overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="url" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        YouTube Link <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="h-11 text-[14px] bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl"
                                        required
                                    />
                                </div>

                                <div className={cn(
                                    "aspect-video rounded-xl border-2 transition-all duration-300 overflow-hidden relative",
                                    videoId ? "border-red-500/30 shadow-md" : "border-dashed border-border/60 bg-muted/20"
                                )}>
                                    {videoId ? (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                alt="Video Thumbnail"
                                                className="w-full h-full object-cover animate-in fade-in"
                                            />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer">
                                                    <Play className="h-5 w-5 ml-1" fill="currentColor" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <Youtube className="h-8 w-8 opacity-20" />
                                            <span className="text-[12px] font-medium opacity-50">Paste URL to preview</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Visibility Settings
                                    </Label>
                                    <div className="flex flex-col gap-2">
                                        {VISIBILITY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, visibility: opt.value as any })}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left w-full",
                                                    formData.visibility === opt.value
                                                        ? "border-primary bg-primary/10 shadow-sm"
                                                        : "border-border bg-card hover:border-primary/30"
                                                )}
                                            >
                                                <opt.icon className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    formData.visibility === opt.value ? "text-primary" : "text-muted-foreground"
                                                )} />
                                                <div className="flex-1">
                                                    <div className={cn(
                                                        "text-[13px] font-semibold leading-none mb-1",
                                                        formData.visibility === opt.value ? "text-primary" : "text-foreground"
                                                    )}>{opt.label}</div>
                                                    <div className="text-[11px] text-muted-foreground leading-none">{opt.description}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right side: Details & Form */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-card animate-in slide-in-from-right-4 fade-in duration-500 custom-scrollbar">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5" />
                                        Assign to Batch <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {batches.map((batch) => (
                                            <button
                                                key={batch.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, batchId: String(batch.id) })}
                                                className={cn(
                                                    "flex items-center justify-center p-3 rounded-xl border transition-all duration-200 text-center",
                                                    formData.batchId === String(batch.id)
                                                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/30"
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
                                </div>

                                <div className="space-y-4 pt-2">
                                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <AlignLeft className="h-3.5 w-3.5" />
                                        Video Information
                                    </Label>
                                    
                                    <div className="space-y-1.5 pt-1">
                                        <Label htmlFor="title" className="text-[12px] font-semibold text-foreground">
                                            Video Title <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Introduction to Organic Chemistry"
                                            className="h-11 text-[15px] font-medium bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="category" className="text-[12px] font-semibold text-foreground">
                                                Category <em>(Optional)</em>
                                            </Label>
                                            <Input
                                                id="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                placeholder="e.g. Physics Revision"
                                                className="h-11 text-[14px] bg-background shadow-sm transition-all focus-visible:ring-primary/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-[12px] font-semibold text-foreground flex items-center justify-between">
                                            <span>Description <em>(Optional)</em></span>
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Write a brief overview of what this video covers..."
                                            rows={5}
                                            className="text-[14px] resize-none bg-background shadow-sm transition-all focus-visible:ring-primary/50 p-3 leading-relaxed"
                                        />
                                    </div>
                                </div>
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
                            disabled={isLoading || !formData.batchId || !formData.title || !formData.url}
                            className="h-10 px-8 text-[13px] font-semibold shadow-sm bg-red-600 hover:bg-red-700 text-white border-0"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Adding Video...
                                </>
                            ) : (
                                "Publish Video"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useCreateLectureMutation } from "@/redux/slices/lectures/lecturesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useGetTeachersQuery } from "@/redux/slices/teachers/teachersApi"
import { toast } from "sonner"
import type { CreateLectureInput } from "@/types"

interface FormState {
    title: string
    subject: string
    description: string
    room: string
    batchId: string
    teacherSelection: string
    date: string
    startTime: string
    endTime: string
}

const INITIAL_FORM: FormState = {
    title: "",
    subject: "",
    description: "",
    room: "",
    batchId: "",
    teacherSelection: "",
    date: "",
    startTime: "",
    endTime: "",
}

export function AddLectureDialog() {
    const [open, setOpen] = useState(false)
    const [createLecture, { isLoading }] = useCreateLectureMutation()
    const { data: batches } = useGetAllBatchesQuery()
    const { data: teachers } = useGetTeachersQuery()
    const [formData, setFormData] = useState<FormState>(INITIAL_FORM)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.batchId) {
            toast.error("Please select a batch")
            return
        }

        const isAutoAssign = formData.teacherSelection === "auto"
        const teacherId = !isAutoAssign && formData.teacherSelection
            ? Number(formData.teacherSelection)
            : null

        const payload: CreateLectureInput = {
            title: formData.title,
            subject: formData.subject,
            description: formData.description || undefined,
            room: formData.room || undefined,
            batchId: Number(formData.batchId),
            teacherId,
            autoAssign: isAutoAssign,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
        }

        try {
            await createLecture(payload).unwrap()
            toast.success("Lecture created successfully")
            setOpen(false)
            setFormData(INITIAL_FORM)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to create lecture")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Lecture</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Create Lecture</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Schedule a new lecture for a batch. Optionally assign a teacher or use auto-assign.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-[13px] font-medium">
                                    Title <span className="text-destructive">*</span>
                                </Label>
                                <Input id="title" value={formData.title} onChange={handleChange} placeholder="Algebra - Quadratic Equations" className="h-9 text-[13px]" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="subject" className="text-[13px] font-medium">
                                    Subject <span className="text-destructive">*</span>
                                </Label>
                                <Input id="subject" value={formData.subject} onChange={handleChange} placeholder="Mathematics" className="h-9 text-[13px]" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Batch <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.batchId}
                                    onValueChange={(v) => setFormData((prev) => ({ ...prev, batchId: v }))}
                                >
                                    <SelectTrigger className="h-9 text-[13px]">
                                        <SelectValue placeholder="Select batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches?.map((batch) => (
                                            <SelectItem key={batch.id} value={String(batch.id)}>{batch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">Teacher</Label>
                                <Select
                                    value={formData.teacherSelection}
                                    onValueChange={(v) => setFormData((prev) => ({ ...prev, teacherSelection: v }))}
                                >
                                    <SelectTrigger className="h-9 text-[13px]">
                                        <SelectValue placeholder="None (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto-assign</SelectItem>
                                        {teachers?.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-[13px] font-medium">
                                    Date <span className="text-destructive">*</span>
                                </Label>
                                <Input id="date" type="date" value={formData.date} onChange={handleChange} className="h-9 text-[13px]" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="startTime" className="text-[13px] font-medium">
                                    Start <span className="text-destructive">*</span>
                                </Label>
                                <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} className="h-9 text-[13px]" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="endTime" className="text-[13px] font-medium">
                                    End <span className="text-destructive">*</span>
                                </Label>
                                <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} className="h-9 text-[13px]" required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="room" className="text-[13px] font-medium">Room</Label>
                            <Input id="room" value={formData.room} onChange={handleChange} placeholder="Room no.03" className="h-9 text-[13px]" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-[13px] font-medium">Description</Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Optional description"
                                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="h-8 text-[13px]">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-[13px] min-w-[120px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Creating...
                                </>
                            ) : (
                                "Create Lecture"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

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
import { useCreateTestMutation } from "@/redux/slices/tests/testsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import { TestType } from "@/types"

const TEST_TYPES: { value: TestType; label: string }[] = [
    { value: "UNIT_TEST", label: "Unit Test" },
    { value: "MIDTERM", label: "Midterm" },
    { value: "FINAL", label: "Final" },
    { value: "QUIZ", label: "Quiz" },
    { value: "PRACTICE", label: "Practice" },
]

interface FormState {
    title: string
    subject: string
    description: string
    testType: TestType
    batchId: string
    totalMarks: string
    passingMarks: string
    date: string
    time: string
    duration: string
    hall: string
    syllabus: string
    instructions: string
}

const INITIAL_FORM: FormState = {
    title: "",
    subject: "",
    description: "",
    testType: "UNIT_TEST",
    batchId: "",
    totalMarks: "",
    passingMarks: "",
    date: "",
    time: "",
    duration: "",
    hall: "",
    syllabus: "",
    instructions: "",
}

export function AddTestDialog() {
    const [open, setOpen] = useState(false)
    const [createTest, { isLoading }] = useCreateTestMutation()
    const { data: batches } = useGetAllBatchesQuery()
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

        try {
            await createTest({
                title: formData.title,
                subject: formData.subject,
                description: formData.description || undefined,
                testType: formData.testType,
                batchId: Number(formData.batchId),
                totalMarks: Number(formData.totalMarks),
                passingMarks: formData.passingMarks ? Number(formData.passingMarks) : undefined,
                date: formData.date,
                time: formData.time || undefined,
                duration: formData.duration ? Number(formData.duration) : undefined,
                hall: formData.hall || undefined,
                syllabus: formData.syllabus || undefined,
                instructions: formData.instructions || undefined,
            }).unwrap()
            toast.success("Test created successfully")
            setOpen(false)
            setFormData(INITIAL_FORM)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to create test")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Test</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Create Test</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Create a new test or exam for a batch. Scores can be uploaded after creation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-[13px] font-medium">
                                    Title <span className="text-destructive">*</span>
                                </Label>
                                <Input id="title" value={formData.title} onChange={handleChange} placeholder="Mid-Term Mathematics" className="h-9 text-[13px]" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="subject" className="text-[13px] font-medium">
                                    Subject <span className="text-destructive">*</span>
                                </Label>
                                <Input id="subject" value={formData.subject} onChange={handleChange} placeholder="Mathematics" className="h-9 text-[13px]" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">Type</Label>
                                <Select value={formData.testType} onValueChange={(v) => setFormData((prev) => ({ ...prev, testType: v as TestType }))}>
                                    <SelectTrigger className="h-9 text-[13px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEST_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Batch <span className="text-destructive">*</span>
                                </Label>
                                <Select value={formData.batchId} onValueChange={(v) => setFormData((prev) => ({ ...prev, batchId: v }))}>
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
                                <Label htmlFor="date" className="text-[13px] font-medium">
                                    Date <span className="text-destructive">*</span>
                                </Label>
                                <Input id="date" type="date" value={formData.date} onChange={handleChange} className="h-9 text-[13px]" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="totalMarks" className="text-[13px] font-medium">
                                    Total Marks <span className="text-destructive">*</span>
                                </Label>
                                <Input id="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} placeholder="100" className="h-9 text-[13px]" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="passingMarks" className="text-[13px] font-medium">Passing</Label>
                                <Input id="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} placeholder="35" className="h-9 text-[13px]" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="time" className="text-[13px] font-medium">Time</Label>
                                <Input id="time" type="time" value={formData.time} onChange={handleChange} className="h-9 text-[13px]" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="duration" className="text-[13px] font-medium">Duration (min)</Label>
                                <Input id="duration" type="number" value={formData.duration} onChange={handleChange} placeholder="60" className="h-9 text-[13px]" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="hall" className="text-[13px] font-medium">Hall / Room</Label>
                            <Input id="hall" value={formData.hall} onChange={handleChange} placeholder="Class 102" className="h-9 text-[13px]" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="syllabus" className="text-[13px] font-medium">Syllabus</Label>
                            <textarea
                                id="syllabus"
                                value={formData.syllabus}
                                onChange={handleChange}
                                placeholder={"Chapter 3: Quadratic Equations\nChapter 4: Arithmetic Progressions"}
                                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="instructions" className="text-[13px] font-medium">Instructions</Label>
                            <textarea
                                id="instructions"
                                value={formData.instructions}
                                onChange={handleChange}
                                placeholder="Important instructions for students"
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
                                "Create Test"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

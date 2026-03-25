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
import { useUploadScoreMutation } from "@/redux/slices/tests/testsApi"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { toast } from "sonner"

interface ScoreUploadDialogProps {
    testId: number;
    batchId: number;
}

interface FormState {
    studentId: string
    marksObtained: string
    remarks: string
}

const INITIAL_FORM: FormState = {
    studentId: "",
    marksObtained: "",
    remarks: "",
}

export function ScoreUploadDialog({ testId, batchId }: ScoreUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [uploadScore, { isLoading }] = useUploadScoreMutation()
    const { data: studentsData } = useGetStudentsQuery({ batchId, limit: 500 })
    const students = studentsData?.students ?? []
    const [formData, setFormData] = useState<FormState>(INITIAL_FORM)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.studentId) {
            toast.error("Please select a student")
            return
        }

        try {
            await uploadScore({
                testId,
                data: {
                    studentId: Number(formData.studentId),
                    marksObtained: Number(formData.marksObtained),
                    remarks: formData.remarks || undefined,
                },
            }).unwrap()
            toast.success("Score uploaded successfully")
            setOpen(false)
            setFormData(INITIAL_FORM)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to upload score")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Score</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Upload Score</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Add a score for a student. Grade and pass/fail status will be auto-calculated.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">
                                Student <span className="text-destructive">*</span>
                            </Label>
                            <Select value={formData.studentId} onValueChange={(v) => setFormData((prev) => ({ ...prev, studentId: v }))}>
                                <SelectTrigger className="h-9 text-[13px]">
                                    <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.fullname}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="marksObtained" className="text-[13px] font-medium">
                                Marks Obtained <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="marksObtained"
                                type="number"
                                step="0.5"
                                min="0"
                                value={formData.marksObtained}
                                onChange={(e) => setFormData((prev) => ({ ...prev, marksObtained: e.target.value }))}
                                placeholder="78.5"
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="remarks" className="text-[13px] font-medium">Remarks</Label>
                            <textarea
                                id="remarks"
                                value={formData.remarks}
                                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                                placeholder="Optional feedback"
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
                                    Uploading...
                                </>
                            ) : (
                                "Upload Score"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

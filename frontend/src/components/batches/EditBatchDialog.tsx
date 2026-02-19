"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useUpdateBatchMutation } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import type { Batch } from "@/types"

const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

interface EditBatchDialogProps {
    batch: Batch
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditBatchDialog({ batch, open, onOpenChange }: EditBatchDialogProps) {
    const [updateBatch, { isLoading }] = useUpdateBatchMutation()

    const [name, setName] = useState(batch.name)
    const capacity = typeof batch.totalStudents === "object" ? batch.totalStudents?.capacity ?? 30 : Number(batch.totalStudents) || 30
    const [newCapacity, setNewCapacity] = useState(capacity)
    const [selectedDays, setSelectedDays] = useState<string[]>(batch.timings.days)

    // Parse "17:00 - 19:00" into start/end
    const timeParts = batch.timings.time?.split(" - ") || ["", ""]
    const [startTime, setStartTime] = useState(timeParts[0]?.trim() || "")
    const [endTime, setEndTime] = useState(timeParts[1]?.trim() || "")

    // Sync when batch changes
    useEffect(() => {
        setName(batch.name)
        const cap = typeof batch.totalStudents === "object" ? batch.totalStudents?.capacity ?? 30 : Number(batch.totalStudents) || 30
        setNewCapacity(cap)
        setSelectedDays(batch.timings.days)
        const parts = batch.timings.time?.split(" - ") || ["", ""]
        setStartTime(parts[0]?.trim() || "")
        setEndTime(parts[1]?.trim() || "")
    }, [batch])

    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedDays.length === 0) {
            toast.error("Please select at least one day")
            return
        }
        if (!startTime || !endTime) {
            toast.error("Please select both start and end times")
            return
        }

        try {
            const enrolled = typeof batch.totalStudents === "object" ? batch.totalStudents?.enrolled ?? 0 : 0
            await updateBatch({
                id: batch.id,
                name,
                timings: {
                    days: selectedDays,
                    time: `${startTime} - ${endTime}`,
                },
                totalStudents: {
                    capacity: newCapacity,
                    enrolled,
                },
            }).unwrap()

            toast.success("Batch updated successfully")
            onOpenChange(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to update batch")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Edit Batch</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Update batch name, schedule, or capacity.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Batch Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-[13px] font-medium">
                                Batch Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Morning Batch A"
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>

                        {/* Schedule Days */}
                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">
                                Schedule Days <span className="text-destructive">*</span>
                            </Label>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-day-${day}`}
                                            checked={selectedDays.includes(day)}
                                            onCheckedChange={() => handleDayToggle(day)}
                                            className="h-4 w-4"
                                        />
                                        <label
                                            htmlFor={`edit-day-${day}`}
                                            className="text-[13px] font-normal leading-none cursor-pointer"
                                        >
                                            {day.slice(0, 3)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">
                                Time Slot <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="edit-startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="h-9 text-[13px] flex-1"
                                    required
                                />
                                <span className="text-[13px] text-muted-foreground">to</span>
                                <Input
                                    id="edit-endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="h-9 text-[13px] flex-1"
                                    required
                                />
                            </div>
                        </div>

                        {/* Capacity */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-capacity" className="text-[13px] font-medium">
                                Student Capacity <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-capacity"
                                type="number"
                                min="1"
                                value={newCapacity}
                                onChange={(e) => setNewCapacity(Number(e.target.value))}
                                className="h-9 text-[13px] w-32"
                                required
                            />
                            <p className="text-[12px] text-muted-foreground">
                                Maximum students allowed in this batch
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-[13px] min-w-[100px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
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

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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useCreateBatchMutation } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"

const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

export function CreateBatchDialog() {
    const [open, setOpen] = useState(false)
    const [createBatch, { isLoading }] = useCreateBatchMutation()

    const [name, setName] = useState("")
    const [capacity, setCapacity] = useState(30)
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

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
            await createBatch({
                name,
                timings: {
                    days: selectedDays,
                    time: `${startTime} - ${endTime}`
                },
                totalStudents: {
                    capacity,
                    enrolled: 0
                }
            }).unwrap()

            toast.success("Batch created successfully")
            setOpen(false)

            // Reset form
            setName("")
            setCapacity(30)
            setSelectedDays([])
            setStartTime("")
            setEndTime("")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to create batch")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Batch</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Create New Batch</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Configure batch name, schedule, and capacity.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Batch Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-[13px] font-medium">
                                Batch Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
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
                                            id={`day-${day}`}
                                            checked={selectedDays.includes(day)}
                                            onCheckedChange={() => handleDayToggle(day)}
                                            className="h-4 w-4"
                                        />
                                        <label
                                            htmlFor={`day-${day}`}
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
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="h-9 text-[13px] flex-1"
                                    required
                                />
                                <span className="text-[13px] text-muted-foreground">to</span>
                                <Input
                                    id="endTime"
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
                            <Label htmlFor="capacity" className="text-[13px] font-medium">
                                Student Capacity <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
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
                            onClick={() => setOpen(false)}
                            className="h-8 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-[13px] min-w-[100px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Creating...
                                </>
                            ) : (
                                "Create Batch"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

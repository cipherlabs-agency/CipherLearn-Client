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
import { Plus } from "lucide-react"
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
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create batch")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create New Batch
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Batch</DialogTitle>
                    <DialogDescription>
                        Enter details for the new batch.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Batch Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                                placeholder="e.g. Morning Batch A"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">
                                Days
                            </Label>
                            <div className="col-span-3 grid grid-cols-2 gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`day-${day}`} 
                                            checked={selectedDays.includes(day)}
                                            onCheckedChange={() => handleDayToggle(day)}
                                        />
                                        <label
                                            htmlFor={`day-${day}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {day}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startTime" className="text-right">
                                Time
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    className="flex-1"
                                />
                                <span>to</span>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="capacity" className="text-right">
                                Capacity
                            </Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Batch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

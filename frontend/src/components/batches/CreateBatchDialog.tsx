"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, CheckCircle2, ChevronRight, Users, Clock, Calendar, ChevronLeft, Minus } from "lucide-react"
import { useState } from "react"
import { useCreateBatchMutation } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const DAYS = [
    { short: "M", label: "Monday", key: "Monday" },
    { short: "T", label: "Tuesday", key: "Tuesday" },
    { short: "W", label: "Wednesday", key: "Wednesday" },
    { short: "T", label: "Thursday", key: "Thursday" },
    { short: "F", label: "Friday", key: "Friday" },
    { short: "S", label: "Saturday", key: "Saturday" },
    { short: "S", label: "Sunday", key: "Sunday" },
]

const TIME_QUICK_PICKS = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "19:00",
]

const DURATIONS = [
    { label: "1 hr", value: 60 },
    { label: "1.5 hr", value: 90 },
    { label: "2 hrs", value: 120 },
    { label: "2.5 hrs", value: 150 },
    { label: "3 hrs", value: 180 },
]

const STEPS = [
    { icon: Users, label: "Details" },
    { icon: Calendar, label: "Days" },
    { icon: Clock, label: "Hours" },
]

interface StepBarProps {
    step: number
    name: string
    capacity: number
    selectedDays: string[]
    startTime: string
    endTime: string
}

function StepBar({ step, name, capacity, selectedDays, startTime, endTime }: StepBarProps) {
    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 bg-muted/30 border-r border-border md:w-[240px] shrink-0">
            <div>
                <h2 className="text-lg font-bold tracking-tight mb-1">Create Batch</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Set up a new batch with scheduling.
                </p>
            </div>

            <div className="flex flex-col gap-5 mt-4">
                {STEPS.map((s, i) => {
                    const isActive = i === step
                    const isPassed = i < step
                    const isUpcoming = i > step

                    return (
                        <div key={i} className="flex items-center gap-3">
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                                isPassed && "bg-primary border-primary text-primary-foreground",
                                isActive && "border-primary text-primary bg-primary/10 shadow-sm",
                                isUpcoming && "border-border text-muted-foreground bg-background",
                            )}>
                                {isPassed ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <s.icon className="h-4 w-4" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[13px] transition-colors",
                                isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                                isPassed && "text-foreground"
                            )}>
                                {s.label}
                            </span>
                        </div>
                    )
                })}
            </div>
            
            {/* Summary preview badge */}
            <div className="mt-auto hidden md:block">
                <div className="rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Live Preview</span>
                    </div>
                    
                    <div className="space-y-2">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">Batch Name</p>
                            <p className="text-[13px] font-bold text-foreground truncate">{name || "Untitled Batch"}</p>
                        </div>
                        
                        {selectedDays.length > 0 && (
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">Days</p>
                                <p className="text-[12px] font-medium text-foreground">{selectedDays.map(d => d.slice(0, 3)).join(", ")}</p>
                            </div>
                        )}
                        
                        {startTime && (
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">Timing</p>
                                <p className="text-[12px] font-medium text-foreground">{startTime} - {endTime}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">Capacity</p>
                            <p className="text-[12px] font-medium text-foreground">{capacity} students</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CreateBatchDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)
    const [createBatch, { isLoading }] = useCreateBatchMutation()

    const [name, setName] = useState("")
    const [capacity, setCapacity] = useState(30)
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [startTime, setStartTime] = useState("")
    const [durationMinutes, setDurationMinutes] = useState<number | "">(60)

    const endTime = (startTime && durationMinutes) ? (() => {
        const [h, m] = startTime.split(':').map(Number);
        const d = new Date(2000, 1, 1, h, m);
        d.setMinutes(d.getMinutes() + Number(durationMinutes));
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    })() : ""

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) {
            setTimeout(() => {
                setStep(0)
                setName("")
                setCapacity(30)
                setSelectedDays([])
                setStartTime("")
                setDurationMinutes(60)
            }, 300)
        }
    }

    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const handleNext = () => {
        if (step === 0 && !name) {
            toast.error("Please enter a batch name")
            return
        }
        if (step === 1 && selectedDays.length === 0) {
            toast.error("Please select at least one day")
            return
        }
        setStep(prev => Math.min(STEPS.length - 1, prev + 1))
    }

    const handleBack = () => {
        setStep(prev => Math.max(0, prev - 1))
    }

    const handleSubmit = async () => {
        if (!startTime || !endTime) {
            toast.error("Please select start time and duration")
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
            handleOpenChange(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to create batch")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Batch</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[700px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Create Batch</DialogTitle></VisuallyHidden>
                <div className="flex flex-col md:flex-row h-[600px]">
                    <StepBar 
                        step={step} 
                        name={name}
                        capacity={capacity}
                        selectedDays={selectedDays}
                        startTime={startTime}
                        endTime={endTime}
                    />

                    <div className="flex flex-col flex-1 relative bg-card">
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {/* STEP 0: Name & Capacity */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label htmlFor="name" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Batch Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Morning Batch A"
                                            className="h-12 text-[15px] font-medium transition-all focus-visible:ring-1"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Student Capacity
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-10 w-10 shrink-0"
                                                onClick={() => setCapacity(Math.max(1, capacity - 1))}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                type="number"
                                                value={capacity}
                                                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="h-10 text-center font-semibold text-lg"
                                            />
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-10 w-10 shrink-0"
                                                onClick={() => setCapacity(capacity + 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: Days */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Schedule Days
                                        </Label>
                                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
                                            {DAYS.map((d) => {
                                                const isSelected = selectedDays.includes(d.key)
                                                return (
                                                    <button
                                                        key={d.key}
                                                        type="button"
                                                        onClick={() => handleDayToggle(d.key)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200",
                                                            isSelected
                                                                ? "border-primary bg-primary/10 text-primary scale-100 shadow-sm"
                                                                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50 scale-95"
                                                        )}
                                                    >
                                                        <span className="text-xl font-bold mb-1">{d.short}</span>
                                                        <span className={cn(
                                                            "text-[10px] font-medium",
                                                            isSelected ? "text-primary/80" : "text-muted-foreground/60"
                                                        )}>
                                                            {d.label.slice(0, 3)}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    
                                    {selectedDays.length > 0 && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Calendar className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[13px] font-medium text-primary">Class meets {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} a week</p>
                                                <p className="text-[11px] text-primary/70 mt-0.5">{selectedDays.join(', ')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Time */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Start Time
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="w-[110px] h-8 text-[12px] bg-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {TIME_QUICK_PICKS.map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setStartTime(t)}
                                                    className={cn(
                                                        "h-9 text-[12px] font-medium rounded-md border transition-all",
                                                        startTime === t
                                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Duration
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {DURATIONS.map(d => (
                                                <button
                                                    key={d.value}
                                                    type="button"
                                                    onClick={() => setDurationMinutes(d.value)}
                                                    className={cn(
                                                        "px-4 h-9 text-[13px] font-medium rounded-full border transition-all",
                                                        durationMinutes === d.value
                                                            ? "border-primary bg-primary/10 text-primary font-semibold"
                                                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                                                    )}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setDurationMinutes("")}
                                                className={cn(
                                                    "px-4 h-9 text-[13px] font-medium rounded-full border transition-all",
                                                    durationMinutes === "" || !DURATIONS.some(d => d.value === durationMinutes)
                                                        ? "border-primary bg-primary/10 text-primary font-semibold"
                                                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                                                )}
                                            >
                                                Custom
                                            </button>
                                        </div>
                                        {(durationMinutes === "" || !DURATIONS.some(d => d.value === durationMinutes)) && (
                                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <Input
                                                    type="number"
                                                    placeholder="Minutes"
                                                    value={durationMinutes || ""}
                                                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || "")}
                                                    className="w-[120px] h-10"
                                                />
                                                <span className="text-[13px] font-medium text-muted-foreground">minutes</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {startTime && durationMinutes && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                            <div>
                                                <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider mb-1">Schedule</p>
                                                <p className="text-[14px] font-medium text-foreground">
                                                    {startTime} — {endTime}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Clock className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 md:p-6 border-t border-border bg-card flex items-center justify-between shrink-0">
                            <div className="flex gap-2">
                                {step > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="h-10 px-4 text-[13px] font-medium"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1.5" />
                                        Back
                                    </Button>
                                )}
                            </div>

                            {/* Step indicators (dots) */}
                            <div className="hidden sm:flex gap-1.5">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-300",
                                            i === step ? "w-6 bg-primary" : "w-1.5 bg-border"
                                        )}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-2">
                                {step < STEPS.length - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="h-10 px-6 text-[13px] font-medium shadow-sm"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1.5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading || !startTime || !endTime}
                                        className="h-10 px-6 text-[13px] font-medium shadow-sm min-w-[120px]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Batch"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

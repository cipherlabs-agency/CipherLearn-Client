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
import { Plus, Loader2, CheckCircle2, ChevronRight, FileText, CalendarClock, Settings2, ChevronLeft, Calendar as CalendarIcon, MapPin, Target, Users, Clock } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useCreateTestMutation } from "@/redux/slices/tests/testsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import { TestType } from "@/types"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const TEST_TYPES: { value: TestType; label: string }[] = [
    { value: "UNIT_TEST", label: "Unit Test" },
    { value: "MIDTERM", label: "Midterm" },
    { value: "FINAL", label: "Final" },
    { value: "QUIZ", label: "Quiz" },
    { value: "PRACTICE", label: "Practice" },
]

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"]

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

const STEPS = [
    { icon: FileText, label: "Test Info" },
    { icon: CalendarClock, label: "Schedule" },
    { icon: Settings2, label: "Marks & Rules" },
]

function StepBar({ step, formData, batches }: { step: number, formData: FormState, batches: any[] }) {
    const selectedBatch = batches?.find(b => b.id.toString() === formData.batchId)

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 bg-muted/30 border-r border-border md:w-[240px] shrink-0">
            <div>
                <h2 className="text-lg font-bold tracking-tight mb-1">Create Test</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Schedule a new test or examination.
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
            
            <div className="mt-auto hidden md:block">
                <div className="rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preview</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="text-[13px] font-medium text-foreground truncate">
                            {formData.title || "Test Title"}
                        </div>
                        {selectedBatch && (
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                {selectedBatch.name}
                            </div>
                        )}
                        {formData.date && (
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                <CalendarIcon className="h-3 w-3" />
                                {formData.date}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function AddTestDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)
    
    const [createTest, { isLoading }] = useCreateTestMutation()
    const { data: batches } = useGetAllBatchesQuery()
    const batchesList = batches || []

    const [formData, setFormData] = useState<FormState>(INITIAL_FORM)

    // Date Picker Helpers
    const { days, monthsArr, dateYears } = useMemo(() => {
        const d = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))
        const m = [
            { label: "Jan", value: "01" }, { label: "Feb", value: "02" }, { label: "Mar", value: "03" },
            { label: "Apr", value: "04" }, { label: "May", value: "05" }, { label: "Jun", value: "06" },
            { label: "Jul", value: "07" }, { label: "Aug", value: "08" }, { label: "Sep", value: "09" },
            { label: "Oct", value: "10" }, { label: "Nov", value: "11" }, { label: "Dec", value: "12" },
        ]
        const currentYear = new Date().getFullYear()
        const y = Array.from({ length: 5 }, (_, i) => (currentYear + 2 - i).toString())
        return { days: d, monthsArr: m, dateYears: y }
    }, [])

    const parseDate = (d: string) => {
        if (!d) return { day: "", month: "", year: "" }
        const [y, m, day] = d.split('-')
        return { day, month: m, year: y }
    }

    const handleDatePartChange = (part: 'day' | 'month' | 'year', value: string) => {
        const { day, month, year } = parseDate(formData.date)
        const newParts = { day, month, year, [part]: value }
        if (newParts.day && newParts.month && newParts.year) {
            setFormData(prev => ({ ...prev, date: `${newParts.year}-${newParts.month}-${newParts.day}` }))
        } else {
            setFormData(prev => ({ ...prev, date: [newParts.year || "0000", newParts.month || "00", newParts.day || "00"].join('-') }))
        }
    }

    useEffect(() => {
        if (open) {
            const savedBatchId = localStorage.getItem('lastUsedBatchId')
            if (savedBatchId && batchesList.some(b => b.id.toString() === savedBatchId)) {
                setFormData(prev => ({ ...prev, batchId: savedBatchId }))
            }
        }
    }, [open, batchesList])

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) {
            setTimeout(() => {
                setStep(0)
                setFormData(INITIAL_FORM)
            }, 300)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleBatchSelect = (batchId: string) => {
        setFormData(prev => ({ ...prev, batchId }))
        localStorage.setItem('lastUsedBatchId', batchId)
    }

    const handleNext = () => {
        if (step === 0) {
            if (!formData.title) {
                toast.error("Please enter test title")
                return
            }
            if (!formData.subject) {
                toast.error("Please select a subject")
                return
            }
        }
        if (step === 1) {
            if (!formData.batchId) {
                toast.error("Please select a batch")
                return
            }
            if (!formData.date) {
                toast.error("Please select test date")
                return
            }
        }
        setStep(prev => Math.min(STEPS.length - 1, prev + 1))
    }

    const handleBack = () => {
        setStep(prev => Math.max(0, prev - 1))
    }

    const handleSubmit = async () => {
        if (!formData.totalMarks) {
            toast.error("Total marks is required")
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
            handleOpenChange(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to create test")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Test</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[700px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Add Test</DialogTitle></VisuallyHidden>
                <div className="flex flex-col md:flex-row h-[500px]">
                    <StepBar step={step} formData={formData} batches={batchesList} />

                    <div className="flex flex-col flex-1 relative bg-card">
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {/* STEP 0: Test Info */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label htmlFor="title" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Test Title <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Weekly Assessment"
                                            className="h-12 text-[15px] font-medium"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Subject <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {SUBJECTS.map(sub => (
                                                <button
                                                    key={sub}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, subject: sub }))}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[12px] font-medium rounded-full border transition-all",
                                                        formData.subject === sub
                                                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                                                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                                                    )}
                                                >
                                                    {sub}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Test Type <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {TEST_TYPES.map(type => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, testType: type.value }))}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all",
                                                        formData.testType === type.value
                                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                                                    )}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Label htmlFor="description" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Description <em>(Optional)</em>
                                        </Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Brief overview of the test"
                                            className="h-10 text-[13px]"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: Schedule & Location */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Assign to Batch <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {batchesList.map((batch) => (
                                                <button
                                                    key={batch.id}
                                                    type="button"
                                                    onClick={() => handleBatchSelect(batch.id.toString())}
                                                    className={cn(
                                                        "flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left",
                                                        formData.batchId === batch.id.toString()
                                                            ? "border-primary bg-primary/10 shadow-sm"
                                                            : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[13px] font-semibold mb-1",
                                                        formData.batchId === batch.id.toString() ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {batch.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="date" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Test Date <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="flex gap-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }))}
                                                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                                                    >
                                                        Today
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <Select 
                                                    value={parseDate(formData.date).day} 
                                                    onValueChange={(v) => handleDatePartChange('day', v)}
                                                >
                                                    <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                        <SelectValue placeholder="DD" />
                                                    </SelectTrigger>
                                                    <SelectContent className="min-w-[70px]">
                                                        {days.map((d: string) => <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select 
                                                    value={parseDate(formData.date).month} 
                                                    onValueChange={(v) => handleDatePartChange('month', v)}
                                                >
                                                    <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                        <SelectValue placeholder="MM" />
                                                    </SelectTrigger>
                                                    <SelectContent className="min-w-[80px]">
                                                        {monthsArr.map((m: { label: string; value: string }) => <SelectItem key={m.value} value={m.value} className="text-[12px]">{m.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select 
                                                    value={parseDate(formData.date).year} 
                                                    onValueChange={(v) => handleDatePartChange('year', v)}
                                                >
                                                    <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                        <SelectValue placeholder="YYYY" />
                                                    </SelectTrigger>
                                                    <SelectContent className="min-w-[90px]">
                                                        {dateYears.map((y: string) => <SelectItem key={y} value={y} className="text-[12px]">{y}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label htmlFor="time" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Start Time
                                            </Label>
                                            <Select 
                                                value={formData.time} 
                                                onValueChange={(val) => setFormData(prev => ({ ...prev, time: val }))}
                                            >
                                                <SelectTrigger className="h-11 text-[14px] bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl">
                                                    <SelectValue placeholder="Select time" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {Array.from({ length: 24 * 4 }, (_, i) => {
                                                        const h = Math.floor(i / 4).toString().padStart(2, '0')
                                                        const m = ((i % 4) * 15).toString().padStart(2, '0')
                                                        return `${h}:${m}`
                                                    }).map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Duration
                                        </Label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {[45, 60, 90, 120, 150, 180].map(mins => (
                                                <button
                                                    key={mins}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, duration: mins.toString() }))}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[12px] font-medium rounded-full border transition-all",
                                                        formData.duration === mins.toString()
                                                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                                                            : "border-border bg-card text-muted-foreground hover:border-primary/20"
                                                    )}
                                                >
                                                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative group max-w-[200px]">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="duration"
                                                type="number"
                                                value={formData.duration}
                                                onChange={handleChange}
                                                placeholder="Custom minutes"
                                                className="pl-9 h-11 text-[14px] bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="hall" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Testing Hall / Location
                                        </Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="hall"
                                                value={formData.hall}
                                                onChange={handleChange}
                                                placeholder="e.g. Room 101, Main Hall"
                                                className="pl-9 h-11 text-[14px] bg-muted/10 border-transparent hover:border-primary/20 focus:border-primary/30 transition-all rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Marks & Rules */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <Label htmlFor="totalMarks" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Total Marks <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="totalMarks"
                                                    type="number"
                                                    value={formData.totalMarks}
                                                    onChange={handleChange}
                                                    placeholder="100"
                                                    className="h-12 pl-10 text-[16px] font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label htmlFor="passingMarks" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Passing Marks
                                            </Label>
                                            <Input
                                                id="passingMarks"
                                                type="number"
                                                value={formData.passingMarks}
                                                onChange={handleChange}
                                                placeholder="33"
                                                className="h-12 text-[16px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="syllabus" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Syllabus To Cover
                                        </Label>
                                        <textarea
                                            id="syllabus"
                                            value={formData.syllabus}
                                            onChange={handleChange}
                                            placeholder="List chapters or topics covered"
                                            className="flex min-h-[70px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none focus:bg-background"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="instructions" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Student Instructions
                                        </Label>
                                        <textarea
                                            id="instructions"
                                            value={formData.instructions}
                                            onChange={handleChange}
                                            placeholder="Any special rules or requirements"
                                            className="flex min-h-[70px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none focus:bg-background"
                                        />
                                    </div>
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

                            {/* Step indicators */}
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
                                        disabled={isLoading}
                                        className="h-10 px-6 text-[13px] font-medium shadow-sm min-w-[124px]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Test"
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

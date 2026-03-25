"use client"

import { useState, useEffect, useMemo } from "react"
import { 
    Plus, 
    CheckCircle2, 
    ChevronRight, 
    FileText, 
    Calendar, 
    Upload, 
    ChevronLeft, 
    Loader2, 
    Users, 
    BookOpen,
    Info,
    ChevronDown,
    CalendarDays
} from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCreateSlotMutation } from "@/redux/slices/assignments/assignmentsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FileUpload } from "@/components/ui/file-upload"

const STEPS = [
    { icon: Info, label: "Details" },
    { icon: Calendar, label: "Deadline" },
    { icon: Upload, label: "Attachments" },
]

interface AddAssignmentDialogProps {
    onSuccess?: () => void
}

function StepBar({ step }: { step: number }) {
    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 bg-muted/30 border-r border-border md:w-[240px] shrink-0">
            <div>
                <h2 className="text-lg font-bold tracking-tight mb-1">New Assignment</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Create a new assignment slot for students.
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
            
            <div className="mt-auto pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <BookOpen className="h-3 w-3" />
                    <span>Learning First</span>
                </div>
            </div>
        </div>
    )
}

export function AddAssignmentDialog({ onSuccess }: AddAssignmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)
    
    const [createSlot, { isLoading }] = useCreateSlotMutation()
    const { data: batches = [] } = useGetAllBatchesQuery()

    const [formData, setFormData] = useState({
        title: "",
        subject: "",
        description: "",
        batchId: "",
        dueDate: "",
    })
    const [attachments, setAttachments] = useState<File[]>([])

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
        const y = Array.from({ length: 5 }, (_, i) => (currentYear + 1 - i).toString())
        return { days: d, monthsArr: m, dateYears: y }
    }, [])

    const parseDate = (d: string) => {
        if (!d) return { day: "", month: "", year: "" }
        const [y, m, day] = d.split('-')
        return { day, month: m, year: y }
    }

    const handleDatePartChange = (part: 'day' | 'month' | 'year', value: string) => {
        const { day, month, year } = parseDate(formData.dueDate)
        const newParts = { day, month, year, [part]: value }
        if (newParts.day && newParts.month && newParts.year) {
            setFormData(prev => ({ ...prev, dueDate: `${newParts.year}-${newParts.month}-${newParts.day}` }))
        } else {
            setFormData(prev => ({ ...prev, dueDate: [newParts.year || "0000", newParts.month || "00", newParts.day || "00"].join('-') }))
        }
    }

    const resetForm = () => {
        setStep(0)
        setFormData({
            title: "",
            subject: "",
            description: "",
            batchId: "",
            dueDate: "",
        })
        setAttachments([])
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) {
            setTimeout(resetForm, 300)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleNext = () => {
        if (step === 0) {
            if (!formData.title) return toast.error("Title is required")
            if (!formData.subject) return toast.error("Subject is required")
            if (!formData.batchId) return toast.error("Please select a batch")
        }
        if (step === 1) {
            if (!formData.dueDate) return toast.error("Due date is required")
        }
        setStep(prev => Math.min(STEPS.length - 1, prev + 1))
    }

    const handleBack = () => {
        setStep(prev => Math.max(0, prev - 1))
    }

    const handleSubmit = async () => {
        try {
            const data = new FormData()
            data.append("title", formData.title)
            data.append("subject", formData.subject)
            if (formData.description) data.append("description", formData.description)
            data.append("batchId", formData.batchId)
            if (formData.dueDate) data.append("dueDate", formData.dueDate)

            attachments.forEach((file) => {
                data.append("attachments", file)
            })

            await createSlot(data).unwrap()
            toast.success("Assignment created successfully")
            setOpen(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create assignment")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm font-semibold">
                    <Plus className="h-4 w-4" />
                    <span>Create Assignment</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[700px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Add Assignment</DialogTitle></VisuallyHidden>
                <div className="flex flex-col md:flex-row h-[520px]">
                    <StepBar step={step} />

                    <div className="flex flex-col flex-1 relative bg-card">
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {/* STEP 0: Assignment Details */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label htmlFor="title" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Assignment Title <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Weekly Chemistry Quiz"
                                            className="h-11 text-[15px] font-medium rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="subject" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Subject <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="e.g. Organic Chemistry"
                                            className="h-11 text-[15px] font-medium rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Target Batch <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {batches.map((batch) => (
                                                <button
                                                    key={batch.id}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, batchId: batch.id.toString() }))}
                                                    className={cn(
                                                        "flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left",
                                                        formData.batchId === batch.id.toString()
                                                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                                            : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[13px] font-semibold",
                                                        formData.batchId === batch.id.toString() ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {batch.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: Deadline & Content */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="dueDate" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Due Date <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="flex gap-1">
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }))}
                                                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted hover:bg-muted/80"
                                                >
                                                    Tomorrow
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] }))}
                                                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted hover:bg-muted/80"
                                                >
                                                    Next Week
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <Select 
                                                value={parseDate(formData.dueDate).day} 
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
                                                value={parseDate(formData.dueDate).month} 
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
                                                value={parseDate(formData.dueDate).year} 
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
                                        <Label htmlFor="description" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Instructions <em>(Optional)</em>
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Any special instructions for the students..."
                                            className="min-h-[140px] text-[14px] rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20 resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Attachments */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Upload Resources
                                        </Label>
                                        <FileUpload
                                            onChange={(files) => setAttachments(files)}
                                            files={attachments}
                                        />
                                        <p className="text-[11px] text-muted-foreground text-center">
                                            Upload PDFs, images, or documents for this assignment.
                                        </p>
                                    </div>
                                    
                                </div>
                            )}
                        </div>

                        {/* Footer */}
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

                            <div className="flex gap-2">
                                {step < STEPS.length - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="h-10 px-6 text-[13px] font-medium shadow-sm transition-all"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1.5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="h-10 px-6 text-[13px] font-medium shadow-sm min-w-[140px]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Post Assignment"
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

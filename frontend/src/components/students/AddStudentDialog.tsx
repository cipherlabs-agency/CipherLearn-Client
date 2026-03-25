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
import { Plus, Loader2, CheckCircle2, ChevronRight, Users, GraduationCap, MapPin, ChevronLeft, Calendar } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useEnrollStudentMutation } from "@/redux/slices/students/studentsApi"
import { useGetBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const STEPS = [
    { icon: Users, label: "Batch" },
    { icon: GraduationCap, label: "Basic Info" },
    { icon: MapPin, label: "Details" },
]

function StepBar({ step, formData, batches }: { step: number, formData: any, batches: any[] }) {
    const selectedBatch = batches.find(b => b.id.toString() === formData.batchId)

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 bg-muted/30 border-r border-border md:w-[240px] shrink-0">
            <div>
                <h2 className="text-lg font-bold tracking-tight mb-1">Enroll Student</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Add a new student to a specific batch.
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
                <div className="rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preview</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="text-[13px] font-medium text-foreground truncate">
                            {formData.firstname || formData.lastname ? `${formData.firstname} ${formData.lastname}` : "Student Name"}
                        </div>
                        {selectedBatch && (
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                {selectedBatch.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const INITIAL_FORM_DATA = {
    name: "", // kept for backwards compatibility if needed
    email: "",
    batchId: "",
    firstname: "",
    lastname: "",
    middlename: "",
    dob: "",
    address: "",
    phone: "",
    parentName: "",
    grade: "",
    instituteId: ""
}

export function AddStudentDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)
    
    const [enrollStudent, { isLoading }] = useEnrollStudentMutation()
    const { data: batchesData } = useGetBatchesQuery()
    const batches = batchesData || []

    const [formData, setFormData] = useState(INITIAL_FORM_DATA)

    // Load last used batchId from localStorage
    useEffect(() => {
        if (open) {
            const savedBatchId = localStorage.getItem('lastUsedBatchId')
            if (savedBatchId && batches.some(b => b.id.toString() === savedBatchId)) {
                setFormData(prev => ({ ...prev, batchId: savedBatchId }))
            }
        }
    }, [open, batches])

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) {
            setTimeout(() => {
                setStep(0)
                setFormData(INITIAL_FORM_DATA)
            }, 300)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleBatchSelect = (batchId: string) => {
        setFormData({ ...formData, batchId })
        localStorage.setItem('lastUsedBatchId', batchId)
    }

    const { days, months, years } = useMemo(() => {
        const d = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))
        const m = [
            { label: "Jan", value: "01" }, { label: "Feb", value: "02" }, { label: "Mar", value: "03" },
            { label: "Apr", value: "04" }, { label: "May", value: "05" }, { label: "Jun", value: "06" },
            { label: "Jul", value: "07" }, { label: "Aug", value: "08" }, { label: "Sep", value: "09" },
            { label: "Oct", value: "10" }, { label: "Nov", value: "11" }, { label: "Dec", value: "12" },
        ]
        const currentYear = new Date().getFullYear()
        const y = Array.from({ length: 40 }, (_, i) => (currentYear - i).toString())
        return { days: d, months: m, years: y }
    }, [])

    const dobParts = useMemo(() => {
        if (!formData.dob) return { day: "", month: "", year: "" }
        const [y, m, d] = formData.dob.split('-')
        return { day: d, month: m, year: y }
    }, [formData.dob])

    const handleDobChange = (part: 'day' | 'month' | 'year', value: string) => {
        const parts = { ...dobParts, [part]: value }
        if (parts.day && parts.month && parts.year) {
            setFormData(prev => ({ ...prev, dob: `${parts.year}-${parts.month}-${parts.day}` }))
        } else {
            // Update partial dob if needed or just handle full
            const newDob = [parts.year || "0000", parts.month || "00", parts.day || "00"].join('-')
            setFormData(prev => ({ ...prev, dob: newDob }))
        }
    }

    const handleNext = () => {
        if (step === 0 && !formData.batchId) {
            toast.error("Please select a batch first")
            return
        }
        if (step === 1) {
            if (!formData.firstname || !formData.lastname) {
                toast.error("Please enter first and last name")
                return
            }
            if (!formData.email) {
                toast.error("Please enter email address")
                return
            }
            if (!formData.dob) {
                toast.error("Please enter date of birth")
                return
            }
        }
        setStep(prev => Math.min(STEPS.length - 1, prev + 1))
    }

    const handleBack = () => {
        setStep(prev => Math.max(0, prev - 1))
    }

    const handleSubmit = async () => {
        if (!formData.address) {
            toast.error("Address is required")
            return
        }

        try {
            // Include constructed name if API requires it, although keeping it empty worked previously
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { name, ...restData } = formData;
            await enrollStudent({
                ...restData,
                batchId: Number(formData.batchId)
            }).unwrap()
            
            toast.success("Student enrolled successfully")
            handleOpenChange(false)
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to enroll student")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Student</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[700px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Add Student</DialogTitle></VisuallyHidden>
                <div className="flex flex-col md:flex-row h-[500px]">
                    <StepBar step={step} formData={formData} batches={batches} />

                    <div className="flex flex-col flex-1 relative bg-card">
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {/* STEP 0: Batch Selection */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Select Batch
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {batches.length > 0 ? batches.map((batch) => (
                                                <button
                                                    key={batch.id}
                                                    type="button"
                                                    onClick={() => handleBatchSelect(batch.id.toString())}
                                                    className={cn(
                                                        "flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left",
                                                        formData.batchId === batch.id.toString()
                                                            ? "border-primary bg-primary/10 scale-100 shadow-sm"
                                                            : "border-border bg-card hover:border-primary/30 hover:bg-muted/50 scale-95"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[14px] font-semibold mb-1",
                                                        formData.batchId === batch.id.toString() ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {batch.name}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                        <Users className="h-3 w-3" />
                                                        {typeof batch.totalStudents === 'object' ? batch.totalStudents.enrolled : 0}/{typeof batch.totalStudents === 'object' ? batch.totalStudents.capacity : '∞'} enrolled
                                                    </span>
                                                </button>
                                            )) : (
                                                <div className="col-span-2 text-center py-8 text-[13px] text-muted-foreground border border-dashed rounded-xl">
                                                    No batches available. Please create a batch first.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: Basic Info */}
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="firstname" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                First Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="firstname"
                                                value={formData.firstname}
                                                onChange={handleChange}
                                                placeholder="John"
                                                className="h-10 text-[14px]"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lastname" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Last Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="lastname"
                                                value={formData.lastname}
                                                onChange={handleChange}
                                                placeholder="Doe"
                                                className="h-10 text-[14px]"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <Label htmlFor="middlename" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Middle Name <em>(Optional)</em>
                                        </Label>
                                        <Input
                                            id="middlename"
                                            value={formData.middlename}
                                            onChange={handleChange}
                                            placeholder="Robert"
                                            className="h-10 text-[14px]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Email Address <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john.doe@example.com"
                                            className="h-10 text-[14px]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="dob" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Date of Birth <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select value={dobParts.day} onValueChange={(val) => handleDobChange('day', val)}>
                                                <SelectTrigger className="h-10 text-[14px] flex-1">
                                                    <SelectValue placeholder="Day" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {days.map(d => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={dobParts.month} onValueChange={(val) => handleDobChange('month', val)}>
                                                <SelectTrigger className="h-10 text-[14px] flex-[1.5]">
                                                    <SelectValue placeholder="Month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map(m => (
                                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={dobParts.year} onValueChange={(val) => handleDobChange('year', val)}>
                                                <SelectTrigger className="h-10 text-[14px] flex-1">
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {years.map(y => (
                                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Details */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="address" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Home Address <span className="text-destructive">*</span>
                                        </Label>
                                        <textarea
                                            id="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="123 Main Street, City, State 12345"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-[14px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none focus:bg-background"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phone" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Phone <em>(Optional)</em>
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+91 9876543210"
                                                className="h-10 text-[14px]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="parentName" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Parent Name <em>(Optional)</em>
                                            </Label>
                                            <Input
                                                id="parentName"
                                                value={formData.parentName}
                                                onChange={handleChange}
                                                placeholder="Parent/Guardian"
                                                className="h-10 text-[14px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="grade" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Grade <em>(Optional)</em>
                                            </Label>
                                            <Input
                                                id="grade"
                                                value={formData.grade}
                                                onChange={handleChange}
                                                placeholder="e.g. 10th"
                                                className="h-10 text-[14px]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="instituteId" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Institute ID <em>(Optional)</em>
                                            </Label>
                                            <Input
                                                id="instituteId"
                                                value={formData.instituteId}
                                                onChange={handleChange}
                                                placeholder="e.g. STU-001"
                                                className="h-10 text-[14px]"
                                            />
                                        </div>
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
                                        disabled={isLoading}
                                        className="h-10 px-6 text-[13px] font-medium shadow-sm min-w-[124px]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Enrolling...
                                            </>
                                        ) : (
                                            "Enroll Student"
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

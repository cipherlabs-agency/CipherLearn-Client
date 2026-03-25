"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, CheckCircle2, ChevronRight, User, Receipt, CreditCard, ChevronLeft, Loader2, Users, Search, Info, Calendar } from "lucide-react"
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
import { useCreateFeeReceiptMutation, useGetFeeStructuresByBatchQuery } from "@/redux/slices/fees/feesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import type { PaymentMode, CreateFeeReceiptInput } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "ONLINE", label: "Online" },
]

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
]

const STEPS = [
    { icon: User, label: "Student Details" },
    { icon: Receipt, label: "Fee Assignment" },
    { icon: CreditCard, label: "Payment Details" },
]

interface CreateReceiptDialogProps {
    onSuccess?: () => void
}

function StepBar({ step, selection }: { step: number, selection: { batchName?: string, studentName?: string, amount?: string } }) {
    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 bg-muted/30 border-r border-border md:w-[240px] shrink-0">
            <div>
                <h2 className="text-lg font-bold tracking-tight mb-1">Fee Receipt</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Create a new fee receipt for a student.
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
                            {selection.studentName || "Select Student"}
                        </div>
                        {selection.batchName && (
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                {selection.batchName}
                            </div>
                        )}
                        {selection.amount && (
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-500 mt-2">
                                ₹{selection.amount}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CreateReceiptDialog({ onSuccess }: CreateReceiptDialogProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)

    const [selectedBatchId, setSelectedBatchId] = useState<string>("")
    const [selectedStudentId, setSelectedStudentId] = useState<string>("")
    const [selectedStructureId, setSelectedStructureId] = useState<string>("")
    const [totalAmount, setTotalAmount] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<string>("")
    const [discountAmount, setDiscountAmount] = useState<string>("0")
    const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH")
    const [transactionId, setTransactionId] = useState<string>("")
    const [chequeNumber, setChequeNumber] = useState<string>("")
    const [bankName, setBankName] = useState<string>("")
    const [academicMonth, setAcademicMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [academicYear, setAcademicYear] = useState<string>(String(new Date().getFullYear()))
    const [dueDate, setDueDate] = useState<string>("")
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [paymentNotes, setPaymentNotes] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    const { data: batches = [] } = useGetAllBatchesQuery()
    const { data: studentsPageData } = useGetStudentsQuery(
        selectedBatchId ? { batchId: Number(selectedBatchId), limit: 500 } : undefined,
        { skip: !selectedBatchId }
    )
    const students = studentsPageData?.students ?? []
    const { data: feeStructures = [] } = useGetFeeStructuresByBatchQuery(
        selectedBatchId ? Number(selectedBatchId) : 0,
        { skip: !selectedBatchId }
    )

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students
        return students.filter((s: any) => 
            s.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [students, searchTerm])

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

    const handleDatePartChange = (setter: (d: string) => void, currentDate: string, part: 'day' | 'month' | 'year', value: string) => {
        const { day, month, year } = parseDate(currentDate)
        const newParts = { day, month, year, [part]: value }
        if (newParts.day && newParts.month && newParts.year) {
            setter(`${newParts.year}-${newParts.month}-${newParts.day}`)
        } else {
            setter([newParts.year || "0000", newParts.month || "00", newParts.day || "00"].join('-'))
        }
    }

    const [createReceipt, { isLoading }] = useCreateFeeReceiptMutation()

    // Update total amount when fee structure changes
    useEffect(() => {
        if (selectedStructureId && feeStructures.length > 0) {
            const structure = feeStructures.find(s => s.id === Number(selectedStructureId))
            if (structure) {
                setTotalAmount(String(structure.amount))
                // Set due date based on structure
                const dueDay = structure.dueDay || 5
                const year = Number(academicYear)
                const month = Number(academicMonth) - 1
                const date = new Date(year, month, dueDay)
                setDueDate(date.toISOString().split('T')[0])
            }
        }
    }, [selectedStructureId, feeStructures, academicMonth, academicYear])

    const resetForm = () => {
        setStep(0)
        setSelectedBatchId("")
        setSelectedStudentId("")
        setSelectedStructureId("")
        setTotalAmount("")
        setPaidAmount("")
        setDiscountAmount("0")
        setPaymentMode("CASH")
        setTransactionId("")
        setChequeNumber("")
        setBankName("")
        setAcademicMonth(String(new Date().getMonth() + 1))
        setAcademicYear(String(new Date().getFullYear()))
        setDueDate("")
        setPaymentDate(new Date().toISOString().split('T')[0])
        setPaymentNotes("")
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) {
            setTimeout(resetForm, 300)
        }
    }

    const handleNext = () => {
        if (step === 0) {
            if (!selectedBatchId) {
                toast.error("Please select a batch")
                return
            }
            if (!selectedStudentId) {
                toast.error("Please select a student")
                return
            }
        }
        if (step === 1) {
            if (!totalAmount) {
                toast.error("Total amount is required")
                return
            }
            if (!dueDate) {
                toast.error("Due date is required")
                return
            }
        }
        setStep(prev => Math.min(STEPS.length - 1, prev + 1))
    }

    const handleBack = () => {
        setStep(prev => Math.max(0, prev - 1))
    }

    const handleSubmit = async () => {
        if (!selectedStudentId || !selectedBatchId || !totalAmount || !dueDate) {
            return
        }

        const input: CreateFeeReceiptInput = {
            studentId: Number(selectedStudentId),
            batchId: Number(selectedBatchId),
            feeStructureId: selectedStructureId ? Number(selectedStructureId) : undefined,
            totalAmount: Number(totalAmount),
            paidAmount: Number(paidAmount) || 0,
            discountAmount: Number(discountAmount) || 0,
            paymentMode,
            transactionId: transactionId || undefined,
            chequeNumber: chequeNumber || undefined,
            bankName: bankName || undefined,
            academicMonth: Number(academicMonth),
            academicYear: Number(academicYear),
            dueDate,
            paymentDate: paidAmount ? paymentDate : undefined,
            paymentNotes: paymentNotes || undefined,
        }

        try {
            await createReceipt(input).unwrap()
            toast.success("Receipt created successfully")
            resetForm()
            setOpen(false)
            onSuccess?.()
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            console.error("Failed to create receipt:", error)
            toast.error(err?.data?.message || "Failed to create receipt")
        }
    }

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

    const selectedBatch = batches.find(b => b.id.toString() === selectedBatchId)
    const selectedStudent = students.find(s => s.id.toString() === selectedStudentId)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Receipt</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[700px] p-0 gap-0 overflow-hidden bg-card border-border/40 shadow-xl">
                <VisuallyHidden><DialogTitle>Create Receipt</DialogTitle></VisuallyHidden>
                <div className="flex flex-col md:flex-row h-[560px]">
                    <StepBar 
                        step={step} 
                        selection={{
                            batchName: selectedBatch?.name,
                            studentName: selectedStudent?.fullname,
                            amount: totalAmount
                        }} 
                    />

                    <div className="flex flex-col flex-1 relative bg-card">
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {/* STEP 0: Student details */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Assign to Batch <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {batches.map((batch) => (
                                                <button
                                                    key={batch.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBatchId(batch.id.toString())
                                                        setSelectedStudentId("")
                                                        setSelectedStructureId("")
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left",
                                                        selectedBatchId === batch.id.toString()
                                                            ? "border-primary bg-primary/10 shadow-sm"
                                                            : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[13px] font-semibold mb-1",
                                                        selectedBatchId === batch.id.toString() ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {batch.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedBatchId && (
                                        <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Select Student <span className="text-destructive">*</span>
                                                </Label>
                                                {students.length > 0 && (
                                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                        {students.length} students
                                                    </span>
                                                )}
                                            </div>

                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="Search student by name or email..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-9 h-11 bg-muted/30 border-transparent hover:bg-muted/50 focus:bg-background focus:border-primary/30 transition-all rounded-xl text-[14px]"
                                                />
                                            </div>

                                            {filteredStudents.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {filteredStudents.map((student) => (
                                                        <button
                                                            key={student.id}
                                                            type="button"
                                                            onClick={() => setSelectedStudentId(String(student.id))}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left",
                                                                selectedStudentId === String(student.id)
                                                                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                                                    : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm",
                                                                    selectedStudentId === String(student.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                                )}>
                                                                    {student.fullname.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={cn(
                                                                        "text-[13px] font-semibold leading-none mb-1",
                                                                        selectedStudentId === String(student.id) ? "text-primary" : "text-foreground"
                                                                    )}>
                                                                        {student.fullname}
                                                                    </span>
                                                                    <span className="text-[11px] text-muted-foreground leading-none">
                                                                        {student.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {selectedStudentId === String(student.id) && (
                                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-[13px] text-muted-foreground bg-muted/30 border border-dashed rounded-xl">
                                                    {searchTerm ? "No students match your search" : "No students in this batch"}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 1: Fee Assignment Details */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Select Fee Type <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedStructureId("")}
                                                className={cn(
                                                    "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                                                    !selectedStructureId
                                                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center",
                                                    !selectedStructureId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[14px] font-bold block">One-Time / Custom</span>
                                                    <p className="text-[11px] text-muted-foreground">Admission, Books, Manual</p>
                                                </div>
                                            </button>
                                            
                                            <div className="relative group flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 opacity-60">
                                                <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-1">
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <span className="text-[13px] font-medium italic">Standard Structures Below</span>
                                            </div>
                                        </div>
                                    </div>

                                    {feeStructures.length > 0 && (
                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Or Select Standard Structure
                                            </Label>
                                            <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                                {feeStructures.map((structure) => (
                                                    <button
                                                        key={structure.id}
                                                        type="button"
                                                        onClick={() => setSelectedStructureId(String(structure.id))}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                                                            selectedStructureId === String(structure.id)
                                                                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                                                : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                                                selectedStructureId === String(structure.id) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                <Receipt className="h-4 w-4" />
                                                            </div>
                                                            <span className={cn(
                                                                "text-[13px] font-semibold",
                                                                selectedStructureId === String(structure.id) ? "text-primary" : "text-foreground"
                                                            )}>
                                                                {structure.name}
                                                            </span>
                                                        </div>
                                                        <div className={cn(
                                                            "text-[13px] font-bold px-2 py-1 rounded-md",
                                                            selectedStructureId === String(structure.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            ₹{structure.amount}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Academic Month <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={academicMonth} onValueChange={setAcademicMonth}>
                                                <SelectTrigger className="h-10 text-[14px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MONTHS.map((month) => (
                                                        <SelectItem key={month.value} value={String(month.value)} className="text-[13px]">
                                                            {month.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Academic Year <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={academicYear} onValueChange={setAcademicYear}>
                                                <SelectTrigger className="h-10 text-[14px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {years.map((year) => (
                                                        <SelectItem key={year} value={String(year)} className="text-[13px]">
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <Label htmlFor="totalAmount" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Total Base Fee (₹) <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="totalAmount"
                                                type="number"
                                                value={totalAmount}
                                                onChange={(e) => setTotalAmount(e.target.value)}
                                                className="h-12 text-[16px] font-bold"
                                                placeholder="e.g. 5000"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="dueDate" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Due Date <span className="text-destructive">*</span>
                                                </Label>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10"
                                                    onClick={() => {
                                                        const today = new Date().toISOString().split('T')[0]
                                                        setDueDate(today)
                                                    }}
                                                >
                                                    Today
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <Select 
                                                    value={parseDate(dueDate).day} 
                                                    onValueChange={(v: string) => handleDatePartChange(setDueDate, dueDate, 'day', v)}
                                                >
                                                    <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                        <SelectValue placeholder="DD" />
                                                    </SelectTrigger>
                                                    <SelectContent className="min-w-[70px]">
                                                        {days.map(d => <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select 
                                                    value={parseDate(dueDate).month} 
                                                    onValueChange={(v: string) => handleDatePartChange(setDueDate, dueDate, 'month', v)}
                                                >
                                                    <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                        <SelectValue placeholder="MM" />
                                                    </SelectTrigger>
                                                    <SelectContent className="min-w-[80px]">
                                                        {monthsArr.map(m => <SelectItem key={m.value} value={m.value} className="text-[12px]">{m.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select 
                                                    value={parseDate(dueDate).year} 
                                                    onValueChange={(v: string) => handleDatePartChange(setDueDate, dueDate, 'year', v)}
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
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Payment Details */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Total Due</div>
                                            <div className="text-2xl font-bold text-foreground">
                                                ₹{Number(totalAmount) - Number(discountAmount) || 0}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Base Amount</div>
                                            <div className="text-[14px] font-medium text-muted-foreground">₹{totalAmount || 0}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <Label htmlFor="paidAmount" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Amount Paying Now (₹)
                                            </Label>
                                            <Input
                                                id="paidAmount"
                                                type="number"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(e.target.value)}
                                                placeholder="0"
                                                className="h-12 text-[16px] font-bold text-emerald-600 focus-visible:ring-emerald-500/50"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label htmlFor="discountAmount" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Discount (₹)
                                            </Label>
                                            <Input
                                                id="discountAmount"
                                                type="number"
                                                value={discountAmount}
                                                onChange={(e) => setDiscountAmount(e.target.value)}
                                                className="h-12 text-[16px]"
                                            />
                                        </div>
                                    </div>

                                    {Number(paidAmount) > 0 && (
                                        <div className="space-y-6 pt-4 border-t border-border animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Payment Method
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {PAYMENT_MODES.map(mode => (
                                                        <button
                                                            key={mode.value}
                                                            type="button"
                                                            onClick={() => setPaymentMode(mode.value)}
                                                            className={cn(
                                                                "px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all",
                                                                paymentMode === mode.value
                                                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                                                            )}
                                                        >
                                                            {mode.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="paymentDate" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            Payment Date
                                                        </Label>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                const today = new Date().toISOString().split('T')[0]
                                                                setPaymentDate(today)
                                                            }}
                                                        >
                                                            Today
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        <Select 
                                                            value={parseDate(paymentDate).day} 
                                                            onValueChange={(v: string) => handleDatePartChange(setPaymentDate, paymentDate, 'day', v)}
                                                        >
                                                            <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                                <SelectValue placeholder="DD" />
                                                            </SelectTrigger>
                                                            <SelectContent className="min-w-[70px]">
                                                                {days.map(d => <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select 
                                                            value={parseDate(paymentDate).month} 
                                                            onValueChange={(v: string) => handleDatePartChange(setPaymentDate, paymentDate, 'month', v)}
                                                        >
                                                            <SelectTrigger className="h-10 bg-muted/10 border-transparent text-[13px] rounded-xl px-2">
                                                                <SelectValue placeholder="MM" />
                                                            </SelectTrigger>
                                                            <SelectContent className="min-w-[80px]">
                                                                {monthsArr.map(m => <SelectItem key={m.value} value={m.value} className="text-[12px]">{m.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select 
                                                            value={parseDate(paymentDate).year} 
                                                            onValueChange={(v: string) => handleDatePartChange(setPaymentDate, paymentDate, 'year', v)}
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
                                                {(paymentMode === 'UPI' || paymentMode === 'ONLINE' || paymentMode === 'BANK_TRANSFER') && (
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="transactionId" className="text-[12px] font-medium">Transaction ID</Label>
                                                        <Input
                                                            id="transactionId"
                                                            value={transactionId}
                                                            onChange={(e) => setTransactionId(e.target.value)}
                                                            placeholder="e.g. UTR12345"
                                                            className="h-9 text-[13px]"
                                                        />
                                                    </div>
                                                )}
                                                {paymentMode === 'CHEQUE' && (
                                                    <>
                                                        <div className="space-y-1.5">
                                                            <Label htmlFor="chequeNumber" className="text-[12px] font-medium">Cheque Number</Label>
                                                            <Input
                                                                id="chequeNumber"
                                                                value={chequeNumber}
                                                                onChange={(e) => setChequeNumber(e.target.value)}
                                                                className="h-9 text-[13px]"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label htmlFor="bankName" className="text-[12px] font-medium">Bank Name</Label>
                                                            <Input
                                                                id="bankName"
                                                                value={bankName}
                                                                onChange={(e) => setBankName(e.target.value)}
                                                                className="h-9 text-[13px]"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="paymentNotes" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Notes
                                                </Label>
                                                <Textarea
                                                    id="paymentNotes"
                                                    value={paymentNotes}
                                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                                    placeholder="Additional notes about this payment..."
                                                    className="resize-none min-h-[60px] text-[13px]"
                                                />
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
                                            "Submit Receipt"
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

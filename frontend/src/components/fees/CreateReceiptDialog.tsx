"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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

interface CreateReceiptDialogProps {
    onSuccess?: () => void
}

export function CreateReceiptDialog({ onSuccess }: CreateReceiptDialogProps) {
    const [open, setOpen] = useState(false)
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
    const [paymentNotes, setPaymentNotes] = useState<string>("")

    const { data: batches = [] } = useGetAllBatchesQuery()
    const { data: students = [] } = useGetStudentsQuery(selectedBatchId ? Number(selectedBatchId) : undefined)
    const { data: feeStructures = [] } = useGetFeeStructuresByBatchQuery(
        selectedBatchId ? Number(selectedBatchId) : 0,
        { skip: !selectedBatchId }
    )

    const [createReceipt, { isLoading }] = useCreateFeeReceiptMutation()

    // Update total amount when fee structure changes
    useEffect(() => {
        if (selectedStructureId) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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
            resetForm()
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            console.error("Failed to create receipt:", error)
        }
    }

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Receipt</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Create Fee Receipt</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Generate a new fee receipt for a student.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Batch <span className="text-destructive">*</span>
                                </Label>
                                <Select value={selectedBatchId} onValueChange={(v) => {
                                    setSelectedBatchId(v)
                                    setSelectedStudentId("")
                                    setSelectedStructureId("")
                                }}>
                                    <SelectTrigger className="h-9 text-[13px]">
                                        <SelectValue placeholder="Select batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map((batch) => (
                                            <SelectItem key={batch.id} value={String(batch.id)} className="text-[13px]">
                                                {batch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Student <span className="text-destructive">*</span>
                                </Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedBatchId}>
                                    <SelectTrigger className="h-9 text-[13px]">
                                        <SelectValue placeholder="Select student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map((student) => (
                                            <SelectItem key={student.id} value={String(student.id)} className="text-[13px]">
                                                {student.fullname}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">Fee Structure</Label>
                            <Select value={selectedStructureId} onValueChange={setSelectedStructureId} disabled={!selectedBatchId}>
                                <SelectTrigger className="h-9 text-[13px]">
                                    <SelectValue placeholder="Select fee structure (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {feeStructures.map((structure) => (
                                        <SelectItem key={structure.id} value={String(structure.id)} className="text-[13px]">
                                            {structure.name} - ₹{structure.amount}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Academic Month <span className="text-destructive">*</span>
                                </Label>
                                <Select value={academicMonth} onValueChange={setAcademicMonth}>
                                    <SelectTrigger className="h-9 text-[13px]">
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
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Academic Year <span className="text-destructive">*</span>
                                </Label>
                                <Select value={academicYear} onValueChange={setAcademicYear}>
                                    <SelectTrigger className="h-9 text-[13px]">
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

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Total Amount <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="h-9 text-[13px]"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">Discount</Label>
                                <Input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="h-9 text-[13px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">Paid Amount</Label>
                                <Input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="h-9 text-[13px]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">
                                    Due Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="h-9 text-[13px]"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">Payment Date</Label>
                                <Input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    disabled={!paidAmount}
                                    className="h-9 text-[13px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">Payment Mode</Label>
                            <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                                <SelectTrigger className="h-9 text-[13px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_MODES.map((mode) => (
                                        <SelectItem key={mode.value} value={mode.value} className="text-[13px]">
                                            {mode.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentMode === "CHEQUE" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[13px] font-medium">Cheque Number</Label>
                                    <Input
                                        value={chequeNumber}
                                        onChange={(e) => setChequeNumber(e.target.value)}
                                        placeholder="Enter cheque number"
                                        className="h-9 text-[13px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[13px] font-medium">Bank Name</Label>
                                    <Input
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="Enter bank name"
                                        className="h-9 text-[13px]"
                                    />
                                </div>
                            </div>
                        )}

                        {(paymentMode === "UPI" || paymentMode === "BANK_TRANSFER" || paymentMode === "ONLINE") && (
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium">Transaction ID</Label>
                                <Input
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter transaction ID"
                                    className="h-9 text-[13px]"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">Notes</Label>
                            <Textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Additional notes..."
                                rows={2}
                                className="text-[13px] resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                            className="h-8 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading || !selectedStudentId || !selectedBatchId || !totalAmount || !dueDate}
                            className="h-8 text-[13px] min-w-[110px]"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner size="sm" className="mr-1.5" />
                                    Creating...
                                </>
                            ) : (
                                "Create Receipt"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

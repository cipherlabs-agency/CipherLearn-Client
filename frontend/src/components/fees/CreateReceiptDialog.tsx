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
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Receipt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Create Fee Receipt</DialogTitle>
                    <DialogDescription>
                        Generate a new fee receipt for a student.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Batch Selection */}
                        <div className="space-y-2">
                            <Label>Batch *</Label>
                            <Select value={selectedBatchId} onValueChange={(v) => {
                                setSelectedBatchId(v)
                                setSelectedStudentId("")
                                setSelectedStructureId("")
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map((batch) => (
                                        <SelectItem key={batch.id} value={String(batch.id)}>
                                            {batch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Student Selection */}
                        <div className="space-y-2">
                            <Label>Student *</Label>
                            <Select
                                value={selectedStudentId}
                                onValueChange={setSelectedStudentId}
                                disabled={!selectedBatchId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={String(student.id)}>
                                            {student.fullname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Fee Structure */}
                    <div className="space-y-2">
                        <Label>Fee Structure (Optional)</Label>
                        <Select
                            value={selectedStructureId}
                            onValueChange={setSelectedStructureId}
                            disabled={!selectedBatchId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select fee structure" />
                            </SelectTrigger>
                            <SelectContent>
                                {feeStructures.map((structure) => (
                                    <SelectItem key={structure.id} value={String(structure.id)}>
                                        {structure.name} - ₹{structure.amount}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Academic Month */}
                        <div className="space-y-2">
                            <Label>Academic Month *</Label>
                            <Select value={academicMonth} onValueChange={setAcademicMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((month) => (
                                        <SelectItem key={month.value} value={String(month.value)}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Academic Year */}
                        <div className="space-y-2">
                            <Label>Academic Year *</Label>
                            <Select value={academicYear} onValueChange={setAcademicYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={String(year)}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Total Amount */}
                        <div className="space-y-2">
                            <Label>Total Amount *</Label>
                            <Input
                                type="number"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                required
                            />
                        </div>

                        {/* Discount */}
                        <div className="space-y-2">
                            <Label>Discount</Label>
                            <Input
                                type="number"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        {/* Paid Amount */}
                        <div className="space-y-2">
                            <Label>Paid Amount</Label>
                            <Input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label>Payment Date</Label>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                disabled={!paidAmount}
                            />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-2">
                        <Label>Payment Mode</Label>
                        <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_MODES.map((mode) => (
                                    <SelectItem key={mode.value} value={mode.value}>
                                        {mode.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Conditional fields based on payment mode */}
                    {paymentMode === "CHEQUE" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cheque Number</Label>
                                <Input
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    placeholder="Enter cheque number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bank Name</Label>
                                <Input
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="Enter bank name"
                                />
                            </div>
                        </div>
                    )}

                    {(paymentMode === "UPI" || paymentMode === "BANK_TRANSFER" || paymentMode === "ONLINE") && (
                        <div className="space-y-2">
                            <Label>Transaction ID</Label>
                            <Input
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="Enter transaction ID"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            placeholder="Additional notes..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !selectedStudentId || !selectedBatchId || !totalAmount || !dueDate}>
                            {isLoading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
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
